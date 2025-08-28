import { Controller, Post, Body, Get, Delete, Param, ParseIntPipe, UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

import { EmpresasService } from 'src/empresas/empresas.service';


@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService, private readonly empresasService: EmpresasService,) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
    const admin = req.user;
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede crear usuarios');
    }

    if (!admin.empresaId) {
      throw new BadRequestException('El usuario no tiene empresa asociada');
    }

    const empresa = await this.empresasService.findOne(admin.empresaId);

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.usersService.create(createUserDto, empresa);
  }



  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }

  // src/users/users.controller.ts
  @UseGuards(JwtAuthGuard)
  @Get('empresa')
  async getEmpresa(@Req() req: RequestWithUser) {
    const admin = req.user;

    if (!admin.empresaId) {
      throw new BadRequestException('El usuario no tiene empresa asociada');
    }

    const empresa = await this.empresasService.findOne(admin.empresaId);
    return empresa;
  }


}
