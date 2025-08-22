import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    empresaId: number | undefined;
    id: number;
    username: string;
    role: 'admin' | 'user' | 'ti';
  };
}
