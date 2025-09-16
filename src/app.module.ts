import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresasModule } from './empresas/empresas.module';
import { MailModule } from './mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // para usar process.env en cualquier lado
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // 🔹 necesario porque Render usa certificados self-signed
      },

    }),
    MailModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    EmpresasModule,
  ],
})
export class AppModule { }
