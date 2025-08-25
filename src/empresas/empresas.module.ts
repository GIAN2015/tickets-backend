import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmpresasController } from './empresas.controller';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { User } from 'src/users/user.entity';
import { EmpresasService } from './empresas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, User])],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [ TypeOrmModule,EmpresasService],
})
export class EmpresasModule {}
