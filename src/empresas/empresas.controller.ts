// src/empresas/empresas.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { RegisterEmpresaDto } from './dto/create-empresa.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/public.decorator'; // <- tu Roles

@UseGuards(JwtAuthGuard)   // exige estar autenticado para todo
@Roles('super-admi')       // 👈 SOLO super-admi para TODO el controller
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  create(@Body() dto: RegisterEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.empresasService.findOne(+id);
  }

  // (si tienes más endpoints, quedan igualmente cerrados)
}
