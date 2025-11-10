import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrakerModule } from './traker/traker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        MAIL_HOST: Joi.string().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASS: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),
        MAIL_RECIPIENTS: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: (connection) => {
          const logger = new Logger('Mongoose');
          connection.on('connected', () => {
            logger.log('¡Conexión a MongoDB establecida exitosamente!');
          });
          connection.on('disconnected', () => {
            logger.warn('Se ha perdido la conexión a MongoDB.');
          });
          connection.on('error', (error) => {
            logger.error('Error en la conexión a MongoDB:', error);
          });
          return connection;
        },
      }),
    }),
    // --- INICIO: Configuración del MailerModule ---
    MailerModule.forRootAsync({
      imports: [ConfigModule], // 2. Importar ConfigModule para que el factory tenga acceso
      inject: [ConfigService], // 3. Inyectar el ConfigService
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
      }),
    }),
    // --- FIN: Configuración del MailerModule ---
    ScheduleModule.forRoot(),
    TrakerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
