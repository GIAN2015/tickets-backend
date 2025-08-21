import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmpresasService } from 'src/empresas/empresas.service';
import { RegisterEmpresaDto } from 'src/empresas/dto/create-empresa.dto';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private jwtService: JwtService,
  ) { }

  // Registrar empresa + admin
  async register(dto: RegisterEmpresaDto) {
    // 1. Crear empresa
    const empresa = await this.empresasService.create({
      razonSocial: dto.razonSocial,
      telefono: dto.telefono,
      ruc: dto.ruc,
      logo: dto.logo,
      correoContacto: dto.correoContacto,
      adminNombre: dto.adminNombre,
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
    });

    // 2. Hashear password del admin
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    // 3. Crear admin asociado a la empresa
    const admin = await this.usersService.create(
      {
        username: dto.adminNombre,
        email: dto.adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
      {
        ...empresa.empresa, // 👈 le pasamos la empresa creada
      } as any,
    );

    return {
      message: 'Empresa y admin creados correctamente',
      empresa,
      admin,
    };
  }

  // Login
  async login(dto: { username: string; password: string }) {
    console.log("👉 DTO recibido:", dto);

    const user = await this.usersService.findByUsername(dto.username);
    console.log("👉 Usuario encontrado:", user);

    if (!user) throw new Error('Usuario no encontrado');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    console.log("👉 Comparación contraseña:", isMatch);

    if (!isMatch) throw new Error('Contraseña incorrecta');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      empresaId: user.empresa, // 👈 también loguea esto si quieres
    };

    console.log("👉 Payload JWT:", payload);

    const token = await this.jwtService.signAsync(payload);
    console.log("👉 Token generado:", token);

    return { access_token: token };
  }

}
