// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles, Public } from './decorators/public.decorator';
import { RegisterEmpresaDto } from 'src/empresas/dto/create-empresa.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public() // 👈 permite acceso sin JWT
  @Post('login')
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)   // ⬅️ protege con JWT
  @Roles('super-admi')       // ⬅️ solo super-admin
  register(@Body() dto: RegisterEmpresaDto) {
    return this.authService.register(dto);
  }

}
