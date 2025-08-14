import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'tickets'), {
    prefix: '/tickets/',
  });

  // Habilitar CORS
  app.enableCors({
    origin: 'http://localhost:3000', // ← el puerto de tu frontend
    credentials: true,              // ← permite enviar cookies si se usan
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  await app.listen(3001); // Puerto de tu backend
}
bootstrap();
