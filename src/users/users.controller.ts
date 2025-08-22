import { Controller, Post, Body, Get, Delete, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { JwtPayload } from 'src/auth/types/jwt-payload.interface';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: RequestWithUser,
  ) {
    // Extraemos al admin logueado desde el JWT
    const admin = req.user ;

    console.log('👉 Admin logueado:', admin);

    // Forzamos que el usuario nuevo herede la empresa del admin
    return this.usersService.create(
createUserDto,
      admin // 👈 siempre asigna la empresa del admin
    );
  }



  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }



}
