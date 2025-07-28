import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    username: string;
    role: 'admin' | 'user' | 'ti';
  };
}
