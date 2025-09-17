import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'tickets'), {
    prefix: '/tickets/',
  });

  // Habilitar CORS
  app.enableCors({
    origin: ["https://sistema-tickets.danyris.com", // frontend vercel
      "http://localhost:3000",],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  // 🔹 Seed inicial: crear admin por defecto si no existe
  const userRepo = app.get(getRepositoryToken(User));
  const existingAdmin = await userRepo.findOne({ where: { role: 'admin' } });



  await app.listen(3001);
}
bootstrap();
