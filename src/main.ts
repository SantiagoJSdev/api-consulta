import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Función asíncrona para inicializar la app de NestJS
const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(3000);
};

// Llamamos a la función de inicialización
bootstrap();
