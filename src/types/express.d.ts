// types/express.d.ts
import { User } from 'src/users/entities/user.entity';

declare module 'express' {
  interface Request {
    user: {
      id: number;
      role: string;
      username?: string;
    } & Partial<User>;
  }
}
