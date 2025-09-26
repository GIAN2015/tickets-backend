import { Controller, Post, Body, Get, Delete, Param, ParseIntPipe, UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException, Put, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

import { EmpresasService } from 'src/empresas/empresas.service';
import { UpdateUserDto } from './dto/update-user.dto';

import { Roles } from 'src/auth/decorators/public.decorator';
import { UpdateUserRoleDto } from 'src/auth/dto/update-user-role.dto';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService, private readonly empresasService: EmpresasService,) { }
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
    const admin = req.user;
    if (admin.role !== 'admin' && admin.role !== 'super-admi') {
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
  @Roles('admin', 'super-admi')
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles('admin', 'super-admi')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }

  // src/users/users.controller.ts
  @UseGuards(JwtAuthGuard)
  @Roles('super-admi')
  @Get('empresa')
  async getEmpresa(@Req() req: RequestWithUser) {
    const admin = req.user;

    if (!admin.empresaId) {
      throw new BadRequestException('El usuario no tiene empresa asociada');
    }

    const empresa = await this.empresasService.findOne(admin.empresaId);
    return empresa;
  }

  // src/users/users.controller.ts
  @UseGuards(JwtAuthGuard)
  @Get('by-empresa')
  async findByEmpresa(@Req() req: RequestWithUser) {
    const user = req.user;

    if (!user.empresaId) {
      throw new BadRequestException('El usuario no tiene empresa asociada');
    }

    // ✅ Devuelve SOLO los usuarios de esa empresa
    return this.usersService.findByEmpresa(user.empresaId);
  }
  @Put(':id/smtp-password')
  async updateSmtpPassword(
    @Param('id') id: number,
    @Body('smtpPassword') smtpPassword: string,
  ): Promise<any> {
    return this.usersService.updateSmtpPassword(id, smtpPassword);
  }


  @Patch(':id')
  @Roles('admin', 'super-admi') // 👈 solo admins pueden editar
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }
  @Patch(':id/toggle')
  @Roles('admin', 'super-admi') // 👈 solo admins pueden editar
  async toggleUser(@Param('id') id: number) {
    return this.usersService.toggleUser(id);
  }

  // users.controller.ts
  @Patch(':id/role')
  @Roles('admin', 'super-admi', 'ti')
  async setRole(@Param('id') id: number, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.setRole(id, dto);
  }

}
