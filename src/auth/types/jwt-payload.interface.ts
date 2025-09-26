// src/auth/types/jwt-user.interface.ts
export interface JwtPayload {
  id: number;
  username:string;
  role: 'super-admi' | 'admin' | 'user' | 'ti';
  empresaId: number;
  email: string;
}
