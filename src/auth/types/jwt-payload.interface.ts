// src/auth/types/jwt-user.interface.ts
export interface JwtPayload {
  id: number;
  username:string;
  role: 'admin' | 'user' | 'ti';
  empresaId: number;
}
