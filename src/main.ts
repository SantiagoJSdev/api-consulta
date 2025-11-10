// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

// Se utiliza para exportar la función handler
export const server = express();

const bootstrap = async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  
  // Tu configuración global
  app.setGlobalPrefix('api');
  app.enableCors();

  // NO LLAMAR a app.listen()
  await app.init();
};

bootstrap();

// Vercel usará 'server' como la función serverless