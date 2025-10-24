import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET } from '../libs/config.js';
import { tokenPayloadSchema } from '../types/tokenPayload.js';

const tokenExtractor = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ mensaje: 'No se envió token' });
    return;
  }

  if (!SECRET) {
    res.status(500).json({ mensaje: 'Error de configuración del servidor' });
    return;
  }

  
  const token = authHeader.startsWith('Bearer ')
  ? authHeader.substring(7)
  : null;
  
  if (!token) {
    res.status(401).json({ mensaje: 'Token malformado' });
    return;
  }

  try {
    const decoded = tokenPayloadSchema.parse(jwt.verify(token, SECRET));
    req.tokenPayload = decoded;
    next();
  } catch (error: unknown) {
    next(error);
  }
};

export default tokenExtractor;
