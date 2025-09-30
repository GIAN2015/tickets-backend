// src/users/users.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/enums/role.enum';

import { MailService } from 'src/mail.service';
import { userBienvenida } from 'src/mail/templates/users';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,

    private readonly mailService: MailService,
  ) {}

  // Lista de usuarios (incluye empresa)
  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['empresa'] });
  }

  // Usuarios por empresa
  async findByEmpresa(empresaId: number) {
    return this.userRepository.find({
      where: { empresa: { id: empresaId } },
      relations: ['empresa'],
    });
  }

  // Crear usuario + enviar correo de bienvenida
  async create(createUserDto: CreateUserDto, empresa: Empresa) {
    // 1) Validaciones básicas
    const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) {
      throw new BadRequestException('Email ya registrado');
    }
    if (!empresa || !empresa.id) {
      throw new BadRequestException('Empresa inválida');
    }

    // 2) Hash de password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3) Crear entidad
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      smtpPassword: createUserDto.smtpPassword, // opcional si lo recibes
      empresa,
      empresaId: empresa.id,
      role: (createUserDto as any).role ?? Role.USER, // por si no llega el role en DTO
      isActive: true,
    });

    // 4) Guardar
    const saved = await this.userRepository.save(user);

    // 5) Enviar correo de bienvenida (no detiene el flujo si falla)
    try {
      await this.mailService.enviarCorreo(
        saved.empresaId,
        [saved.email],
        'Bienvenido(a) - Acceso al Sistema de Tickets',
        userBienvenida({
          nombre: saved.username ?? saved.email.split('@')[0],
          email: saved.email,
          // Mandamos la contraseña original ingresada (temporal o definitiva)
          passwordTemporal: createUserDto.password,
        }),
      );
      console.log('📧 Bienvenida enviada a:', saved.email);
    } catch (e: any) {
      console.error('❌ Error enviando bienvenida:', e?.message || e);
      // No lanzamos error para no romper el registro
    }

    return saved;
  }

  // Cambiar contraseña (ya hasheada)
  async updatePassword(id: number, newHashedPassword: string) {
    await this.userRepository.update(id, { password: newHashedPassword });
  }

  async findByEmail(email: string, options?: { relations?: string[] }): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: options?.relations || [],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username }, relations: ['empresa'] });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: ['empresa'] });
  }

  async delete(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userRepository.remove(user);
  }

  async updateSmtpPassword(id: number, smtpPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // ⚠️ Si quieres, aquí puedes cifrar en BD (recomendado)
    user.smtpPassword = smtpPassword;
    return this.userRepository.save(user);
  }

  // Update “seguro”: filtra campos sensibles
  async update(id: number, dto: UpdateUserDto & Record<string, any>) {
    delete (dto as any)?.role;
    delete (dto as any)?.empresaId;
    delete (dto as any)?.smtpPassword;

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      dto.password = await bcrypt.hash(dto.password, salt);
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async toggleUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async setRole(id: number, dto: { role: Role }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // No permitir degradar al único super-admi
    if (user.role === Role.SUPER_ADMI && dto.role !== Role.SUPER_ADMI) {
      const totalSupers = await this.userRepository.count({ where: { role: Role.SUPER_ADMI } });
      if (totalSupers <= 1) {
        throw new BadRequestException('No puedes degradar al único super-admi del sistema');
      }
    }

    user.role = dto.role;
    return this.userRepository.save(user);
  }
}
