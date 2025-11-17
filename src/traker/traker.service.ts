import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import { Model } from 'mongoose';
import {
  TrackedValue,
  TrackedValueDocument,
} from './entities/tracked-value.schema';

@Injectable()
export class TrakerService {
  private readonly logger = new Logger(TrakerService.name);
  private readonly PRECISION = 4;
  
  constructor(
    @InjectModel(TrackedValue.name)
    private trackedValueModel: Model<TrackedValueDocument>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // Se ejecuta cada 5 minutos
 // @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Ejecutando tarea programada para rastrear valor...');
    await this.trackValue();
  }

  private async scrapeWebsiteForValue(): Promise<string | null> {
    try {
      // IMPORTANTE: Reemplaza esta URL y el selector con los de la web que quieres leer
      const url = 'https://www.bcv.org.ve/';
      const selector = '#dolar .centrado strong';

      // Agente HTTPS para ignorar la verificación del certificado SSL
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const { data } = await axios.get(url, { httpsAgent: agent });
      const $ = cheerio.load(data);

      const scrapedValue = $(selector).text().trim();

      if (!scrapedValue) {
        this.logger.warn(`No se encontró ningún valor con el selector "${selector}" en ${url}`);
        return null;
      }

      this.logger.log(`Valor obtenido de la web: ${scrapedValue}`);
      return scrapedValue;
    } catch (error) {
      this.logger.error('Error al hacer web scraping', error.stack);
      return null;
    }
  }

  /*
  async trackValue(): Promise<void> {
    const newValueString = await this.scrapeWebsiteForValue();
    if (newValueString === null) return;

    const newValue = this.normalizeValue(newValueString); 
    if (isNaN(newValue)) return; // Si no es un número válido, salimos.

    // 1. Obtener el inicio del día de hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Buscar el último valor guardado en el día de hoy
    const lastValueToday = await this.trackedValueModel
      .findOne({
        createdAt: { $gte: startOfDay },
      })
      .sort({ createdAt: -1 });

    // 3. Comparar y decidir si guardar
    if (
      !lastValueToday ||
      lastValueToday.value !== newValue
    ) {
      this.logger.log(`Nuevo valor (${newValue}) detectado. Guardando en el historial...`);
      const createdValue = new this.trackedValueModel({ value: newValue });
      await createdValue.save()

      // 4. Enviar el correo electrónico
      this.logger.log('Enviando correo de notificación...');
      await this.mailerService.sendMail({
        to: this.configService.get<string>('MAIL_RECIPIENTS'),
        subject: '¡El precio del dólar ha cambiado!',
        html: `
          <h1>Actualización del Precio del Dólar</h1>
          <p>El nuevo valor del dólar es: <b>${newValue}</b></p>
          <p>Valor anterior: ${lastValueToday?.value || 'No había registro previo hoy.'}</p>
        `,
      });
      this.logger.log('Correo enviado exitosamente.');

    } else {
      this.logger.log('El valor es el mismo que el último guardado hoy. No se hace nada.');
    }
  }
  */

  async trackValue(): Promise<void> {
    const newValueString = await this.scrapeWebsiteForValue();
    if (newValueString === null) return;

    // newValue es ahora un número limpio (ej. 233.5576)
    const rawNewValue = this.normalizeValue(newValueString); 
    if (isNaN(rawNewValue)) return; 

    // 1. Redondear el nuevo valor para comparación y guardado
    const newValue = parseFloat(rawNewValue.toFixed(this.PRECISION)); // Redondea a 4 decimales y asegura el tipo number
 
    // 🛑 CORRECCIÓN: Buscar el valor más reciente ABSOLUTO (de hoy, ayer o cuando sea)
    const lastValue = await this.trackedValueModel
      .findOne({}) // No aplicamos filtro de fecha
      .sort({ createdAt: -1 }); // Ordenamos para obtener el último registro

      // 3. Normalizar el último valor guardado para una comparación precisa
    let normalizedLastValue: number | null = null;
    if (lastValue) {
      // Redondeamos el valor de la DB al mismo número de decimales que el nuevo valor.
      normalizedLastValue = parseFloat(lastValue.value.toFixed(this.PRECISION));
    }

    // 🛑 Comparamos si no hay registro O si el último valor guardado es diferente al nuevo
        
      if (
      !lastValue ||
      normalizedLastValue !== newValue 
    ) {
      this.logger.log(`Nuevo valor (${newValue}) detectado. Guardando en el historial...`);
      // 5. Guardamos el número limpio y redondeado
      const createdValue = new this.trackedValueModel({ value: newValue }); 
      await createdValue.save()


      // 4. Enviar el correo electrónico
      this.logger.log('Enviando correo de notificación...');
      await this.mailerService.sendMail({
        to: this.configService.get<string>('MAIL_RECIPIENTS'),
        subject: '¡El precio del dólar ha cambiado!',
        html: `
          <h1>Actualización del Precio del Dólar</h1>
          <p>El nuevo valor del dólar es: <b>${newValue}</b></p>
          <p>Valor anterior: ${lastValue?.value || 'No había registro previo.'}</p> 
          `,
      });
      this.logger.log('Correo enviado exitosamente.');

    } else {
      this.logger.log('El valor es el mismo que el último guardado. No se hace nada.');
    }
}


 /* private normalizeValue(value: string): number {
    if (!value) return NaN;
    // Reemplazar la coma decimal por un punto y convertir a número
    const normalizedString = value.replace(',', '.'); 
    return parseFloat(normalizedString);
  }
    */
   private normalizeValue(value: string): number {
    if (!value) return NaN;

    // 1. Limpieza agresiva: Elimina todos los caracteres que NO sean dígitos (0-9), coma (,), o punto (.).
    // Esto quita símbolos de moneda, espacios, letras, etc.
    const cleanedValue = value.replace(/[^0-9.,]/g, '');

    // 2. Reemplazar la coma decimal por un punto (solo si hay una coma para reemplazar)
    let normalizedString = cleanedValue.replace(',', '.'); 
    
    // 3. (OPCIONAL pero seguro): Asegurar que solo el último punto sea el separador decimal 
    // (útil si hay separadores de miles que también son puntos, aunque no aplica al BCV)
    // Para el BCV, basta con asegurar que solo haya un punto.
    
    // 4. Convertir a número (parseFloat solo funcionará correctamente si usa el punto como decimal)
    const result = parseFloat(normalizedString);

    // 5. Devolver el resultado (un número o NaN)
    return result;
  }
}