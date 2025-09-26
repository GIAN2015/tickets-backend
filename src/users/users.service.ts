import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from 'src/auth/dto/update-user-role.dto';
import { Role } from 'src/enums/role.enum';


@Injectable()
export class UsersService {
  // src/users/users.service.ts
  async findByEmpresa(empresaId: number) {
    return this.userRepository.find({
      where: { empresa: { id: empresaId } },
      relations: ['empresa'], // opcional, si quieres la info de la empresa
    });
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Empresa) // <-- aquí inyectas Empresa
    private readonly empresaRepository: Repository<Empresa>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['empresa'] }); // trae con empresa
  }

  async create(createUserDto: CreateUserDto, empresa: Empresa) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltOrRounds);
    ;



    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      smtpPassword: createUserDto.smtpPassword,
      empresa,
      empresaId: empresa.id,
    });

    return this.userRepository.save(user);
  }

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
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.userRepository.remove(user);
  }

  async updateSmtpPassword(id: number, smtpPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.smtpPassword = smtpPassword; // 👉 Idealmente encriptar aquí
    return this.userRepository.save(user);
  }

  // users.service.ts
  async update(id: number, dto: any) {
    // 🔐 blindaje por si alguien intenta colar campos sensibles
    delete dto?.role;
    delete dto?.empresaId;
    delete dto?.smtpPassword;

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

    // 🚫 no permitir degradar al único super-admi
    if (user.role === Role.SUPER_ADMI && dto.role !== Role.SUPER_ADMI) {
      const totalSupers = await this.userRepository.count({
        where: { role: Role.SUPER_ADMI },   // ✅ enum, no string
      });
      if (totalSupers <= 1) {
        throw new BadRequestException('No puedes degradar al único super-admi del sistema');
      }
    }

    user.role = dto.role; // dto.role ya es Role
    return this.userRepository.save(user);
  }

}
