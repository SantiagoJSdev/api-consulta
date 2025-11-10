// src/main.ts (Opción Simplificada)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express'; 
const express = require('express');

// 1. Exporta la función handler
export const server = express();

const bootstrap = async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server), // Usa el handler exportado
  );
  
  app.setGlobalPrefix('api'); 
  app.enableCors();

  await app.init();
};

bootstrap();