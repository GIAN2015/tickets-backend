// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { EmpresasModule } from 'src/empresas/empresas.module';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { MailModule } from 'src/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Empresa]), EmpresasModule, MailModule
    // Si llegas a necesitar AuthModule aquí y hay ciclo, usas forwardRef:
    // forwardRef(() => AuthModule),
    // EmpresasModule no es obligatorio importarlo aquí salvo que necesites usar su servicio
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule], // exportas para que otros módulos puedan inyectar UsersService
})
export class UsersModule { }
