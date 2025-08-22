// auth/types/jwt-payload.interface.ts
export interface JwtPayload {
  id: number;  // 👈 estándar JWT (subject = user.id)
  username: string;
  role: 'admin' | 'user' | 'ti';
  empresaId?: number;
}
