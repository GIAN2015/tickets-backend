import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
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
      empresa,
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
}
