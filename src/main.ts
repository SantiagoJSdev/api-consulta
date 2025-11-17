// src/main.ts
 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
// Usar require() es más robusto para Express en el entorno Node.js
const express = require('express'); 

// 1. Variable global para cachear el handler del servidor
let cachedServer; 

async function bootstrapServer() {
  // Si el servidor ya está inicializado, lo devolvemos inmediatamente (Warm Start)
  if (cachedServer) {
    return cachedServer;
  }
  
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Tu configuración global
  app.setGlobalPrefix('api');
  app.enableCors();

  // CRÍTICO: Inicializar módulos (DB, Mailer, etc.) sin iniciar el servidor
  await app.init(); 
 
  // 2. Almacenar el handler de Express en la caché global
  cachedServer = expressApp; 
  return cachedServer;
}

// 🛑 EXPORTACIÓN POR DEFECTO: La función handler que Vercel llama.
export default async (req, res) => {
    // Ejecuta el proceso de bootstrap solo si no está cacheado (Cold Start)
    if (!cachedServer) {
        await bootstrapServer();
    }
    // 3. Pasar la petición y respuesta al handler de Express cacheado
    cachedServer(req, res);
};

 
/*
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Tu configuración global (Se mantiene)
  app.setGlobalPrefix('api');
  app.enableCors();

  // Iniciar el servidor en el puerto 3000
  await app.listen(3000); 
  
  // Imprimir la URL base al iniciar
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

*/