import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';
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

  async trackValue(): Promise<void> {
    const newValue = await this.scrapeWebsiteForValue();
    if (newValue === null) return;

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
    if (!lastValueToday || lastValueToday.value !== newValue) {
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
}