import { type NextFunction, type Request, type Response } from 'express';
import {
  userSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
  validateAge,
} from '../schemas/Auth.js';
import authService from '../services/auth.service.js';
import calculateAge from '../utils/calcAge.js';

const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bodyWhitRole = { role: req.body.role || 'PACIENTE', ...req.body };
    const newUser = userSchema.parse(bodyWhitRole);
    console.log('[signup] request', {
      email: newUser.email,
      fullname: newUser.fullname,
    });

    const age = calculateAge(newUser.date_of_birth);
    validateAge.parse(age);

    const result = await authService.signup(newUser);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(201).json(result.data);
  } catch (error: unknown) {
    console.error('[signup] unhandled error', error);
    next(error);
  }
};

const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loginData = loginSchema.parse(req.body);

    const result = await authService.login(loginData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    next(error);
  }
};

const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifyData = verifyEmailSchema.parse(req.body);

    const result = await authService.verifyEmail(verifyData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    next(error);
  }
};

const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resendData = resendVerificationCodeSchema.parse(req.body);

    const result = await authService.resendVerificationCode(resendData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    next(error);
  }
};

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tokenPayload) {
      res.status(401).json({ valid: false, error: 'No token payload found' });
      return;
    }

    const { userId } = req.tokenPayload;

    // Verificar permisos basados en roles (si se especificaron)
    const { allowedRoles } = req.query;

    if (
      !allowedRoles ||
      allowedRoles === '' ||
      typeof allowedRoles !== 'string'
    ) {
      res.status(403).json({
        error: 'Permisos insuficientes',
      });
      return;
    }

    const rolesArray = allowedRoles.split(',').map(r => r.trim());

    const result = await authService.verifyToken(userId, rolesArray);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    next(error);
  }
};

export default {
  signup,
  login,
  verifyEmail,
  resendVerificationCode,
  verifyToken,
};
