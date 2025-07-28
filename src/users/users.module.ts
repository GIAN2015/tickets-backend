// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module'; // solo si lo necesitas dentro

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // Si UsersService necesita algo del AuthModule y hay ciclo, usa forwardRef:
    // forwardRef(() => AuthModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule], // <-- importante exportar UsersService
})
export class UsersModule {}
