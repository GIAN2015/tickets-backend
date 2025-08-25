// src/empresas/empresas.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { RegisterEmpresaDto } from './dto/create-empresa.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) { }

  @Post()
  @UseGuards(JwtAuthGuard) // necesita estar logueado

  create(@Body() createEmpresaDto: RegisterEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }



  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.empresasService.findOne(+id);
  }
}
