// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from './app.module';
import { User } from './users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🧭 Prefijo global
  app.setGlobalPrefix('api');

  // 🧼 Pipes globales de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🧾 Archivos estáticos (adjuntos)
  app.useStaticAssets(join(__dirname, '..', 'tickets'), {
    prefix: '/tickets/',
  });

  // 🌐 CORS (local + vercel)
  app.enableCors({
    origin: [
      'http://localhost:3000',              // Frontend local
      'https://sistema-tickets.danyris.com' // Frontend en Vercel
    ],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: [
      'Authorization','Content-Type','Accept',
      'X-Requested-With','X-CSRF-Token'
    ],
    exposedHeaders: ['Date','Content-Disposition'],
  });

  // 👤 Seed inicial: crear super-admin si la tabla está vacía
  const userRepo = app.get(getRepositoryToken(User));
  const totalUsers = await userRepo.count();

  if (totalUsers === 0) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const defaultUser = userRepo.create({
      username: 'Super Admi',
      email: 'giansinarahua@outlook.com',
      password: hashedPassword,
      role: 'super-admi',
      isActive: true,
    });

    await userRepo.save(defaultUser);
    console.log('✅ Cuenta super-admi creada: giansinarahua@outlook.com / 123456');
  }

  // 🚀 Arrancar servidor
  await app.listen(3001);
  console.log(`✅ API corriendo en http://localhost:3001/api`);
}

bootstrap();
