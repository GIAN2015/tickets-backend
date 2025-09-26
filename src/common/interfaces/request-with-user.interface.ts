// src/common/interfaces/request-with-user.interface.ts
import { Request } from 'express';
import { Role } from 'src/enums/role.enum';

export interface JwtUser {
  id: number;
  username: string;
  email?: string;
  role: Role;           // ✅ enum, no string literal
  empresaId?: number;
}

export type RequestWithUser = Request & { user: JwtUser };
