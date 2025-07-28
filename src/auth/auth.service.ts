import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async register(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersService.create({
      ...dto,
      password: hashedPassword,
    });
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) throw new Error('Usuario no encontrado');
    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) throw new Error('Contraseña incorrecta');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);
    return { access_token: token };
  }
  
}
