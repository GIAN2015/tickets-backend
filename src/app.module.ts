// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresasModule } from './empresas/empresas.module';
import { MailModule } from './mail.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProd = process.env.NODE_ENV === 'production';
        return {
          type: 'postgres',
          url: process.env.DATABASE_URL!,
          entities: [__dirname + '/**/*.entity{.ts,.js}'], // 👈 registra todas
          autoLoadEntities: true,                         // opciona
          synchronize: false,
          ssl: { rejectUnauthorized: false },
          extra: { ssl: { rejectUnauthorized: false } },
        };
      },
    }),



    MailModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    EmpresasModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
