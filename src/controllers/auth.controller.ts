import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../libs/config.js';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

  const payload = { id: user.id, email: user.email, role: (user as any).role ?? 'USER' };
  const signOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] } as SignOptions;
  const token = jwt.sign(payload, JWT_SECRET as Secret, signOptions);

    const { password: _p, ...safeUser } = user as any;
    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    return next(err as any);
  }
};
