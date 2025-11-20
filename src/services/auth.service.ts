import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import emailConfig from '../config/emailConfig.js';
import { SECRET } from '../libs/config.js';
import calculateAge from '../utils/calcAge.js';
import { z } from 'zod';
import {
  type User,
  loginSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
} from '../schemas/Auth.js';

type LoginSchemaType = z.infer<typeof loginSchema>;
type VerifyEmailSchemaType = z.infer<typeof verifyEmailSchema>;
type ResendVerificationCodeSchemaType = z.infer<
  typeof resendVerificationCodeSchema
>;

const prisma = new PrismaClient();

interface AuthServiceResult {
  success: boolean;
  error?: {
    status: number;
    message: string;
  };
  data?: unknown;
}

class AuthService {
  async signup(userData: User): Promise<AuthServiceResult> {
    try {
      // Verificar si el usuario ya existe
      const userExist = await prisma.users.findUnique({
        where: { email: userData.email },
        select: { id: true },
      });

      if (userExist) {
        return {
          success: false,
          error: {
            status: 400,
            message: 'User already exists',
          },
        };
      }

      // Validaciones específicas según el rol
      if (userData.role === 'MEDICO') {
        // Verificar que la especialidad existe
        const specialtyExists = await prisma.specialty.findUnique({
          where: { id: userData.medico.specialtyId },
        });

        if (!specialtyExists) {
          return {
            success: false,
            error: {
              status: 400,
              message: 'La especialidad especificada no existe',
            },
          };
        }
      }

      if (userData.role === 'ENFERMERA') {
        // Verificar que el departamento existe
        const departmentExists = await prisma.department.findUnique({
          where: { id: userData.enfermera.departmentId },
        });

        if (!departmentExists) {
          return {
            success: false,
            error: {
              status: 400,
              message: 'El departamento especificado no existe',
            },
          };
        }
      }

      // Calcular edad
      const age = calculateAge(userData.date_of_birth);

      // Generar código de verificación
      const verificationCode = emailConfig.generateVerificationCode();
      const verificationCodeExpires = new Date();
      verificationCodeExpires.setMinutes(
        verificationCodeExpires.getMinutes() + 15
      );

      // Preparar datos del usuario según el rol
      let createUser;

      const baseFields = {
        email: userData.email,
        fullname: userData.fullname,
        documentNumber: userData.documentNumber,
        role: userData.role,
        age,
        date_of_birth: new Date(userData.date_of_birth),
        current_password: await bcrypt.hash(userData.current_password, 10),
        verificationCode,
        verificationCodeExpires,
        phone: userData.phone,
        status: userData.status || 'PENDING',
      };

      switch (userData.role) {
        case 'MEDICO':
          createUser = await prisma.users.create({
            data: {
              ...baseFields,
              medico: {
                specialtyId: userData.medico.specialtyId,
                license_number: userData.medico.license_number,
              },
            },
          });
          break;
        case 'ENFERMERA':
          createUser = await prisma.users.create({
            data: {
              ...baseFields,
              enfermera: {
                departmentId: userData.enfermera.departmentId,
              },
            },
          });
          break;
        case 'PACIENTE':
          createUser = await prisma.users.create({
            data: {
              ...baseFields,
              paciente: {
                address: userData.paciente.address,
              },
            },
          });
          break;
        case 'ADMINISTRADOR':
          createUser = await prisma.users.create({
            data: baseFields,
          });
          break;
      }

      console.log('[AuthService.signup] user created', {
        id: createUser.id,
        email: createUser.email,
        role: createUser.role,
      });

      // Enviar email de verificación
      console.log('[AuthService.signup] sending verification email...');
      const emailResult = await emailConfig.sendVerificationEmail(
        userData.email,
        userData.fullname,
        verificationCode
      );

      if (!emailResult.success) {
        console.error(
          '[AuthService.signup] email sending failed:',
          emailResult.error
        );
        // Revertir creación de usuario si falla el envío del email
        await prisma.users.delete({
          where: { id: createUser.id },
        });
        return {
          success: false,
          error: {
            status: 500,
            message: 'Error sending verification email',
          },
        };
      }

      return {
        success: true,
        data: {
          id: createUser.id,
          email: createUser.email,
          fullname: createUser.fullname,
          status: createUser.status,
          role: createUser.role,
          message: 'Usuario creado. Código enviado al correo.',
        },
      };
    } catch (error) {
      console.error('[AuthService.signup] unhandled error', error);
      throw error;
    }
  }

  async login(loginData: LoginSchemaType): Promise<AuthServiceResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { email: loginData.email },
        select: {
          id: true,
          email: true,
          fullname: true,
          status: true,
          role: true,
          current_password: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            status: 401,
            message: 'Credenciales inválidas',
          },
        };
      }

      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          error: {
            status: 401,
            message: 'Email pendiente o inactivo. Verifique su cuenta.',
          },
        };
      }

      const passwordMatch = await bcrypt.compare(
        loginData.current_password,
        user.current_password
      );

      if (!passwordMatch) {
        return {
          success: false,
          error: {
            status: 401,
            message: 'Credenciales inválidas',
          },
        };
      }

      if (!SECRET) {
        return {
          success: false,
          error: {
            status: 500,
            message: 'Error de configuración del servidor',
          },
        };
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
        },
        SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        data: {
          message: 'Login exitoso',
          user: {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            status: user.status,
            role: user.role,
          },
          token,
        },
      };
    } catch (error) {
      console.error('[AuthService.login] unhandled error', error);
      throw error;
    }
  }

  async verifyEmail(
    verifyData: VerifyEmailSchemaType
  ): Promise<AuthServiceResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { email: verifyData.email },
        select: {
          id: true,
          email: true,
          fullname: true,
          status: true,
          verificationCode: true,
          verificationCodeExpires: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Usuario no encontrado',
          },
        };
      }

      if (user.status === 'ACTIVE') {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Usuario ya verificado',
          },
        };
      }

      if (user.verificationCode !== verifyData.verificationCode) {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Código de verificación inválido',
          },
        };
      }

      if (
        user.verificationCodeExpires &&
        user.verificationCodeExpires < new Date()
      ) {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Código de verificación expirado',
          },
        };
      }

      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          verificationCode: null,
          verificationCodeExpires: null,
        },
      });

      return {
        success: true,
        data: {
          message: 'Email verificado exitosamente',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            fullname: updatedUser.fullname,
            status: updatedUser.status,
          },
        },
      };
    } catch (error) {
      console.error('[AuthService.verifyEmail] unhandled error', error);
      throw error;
    }
  }

  async resendVerificationCode(
    resendData: ResendVerificationCodeSchemaType
  ): Promise<AuthServiceResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { email: resendData.email },
        select: {
          id: true,
          email: true,
          fullname: true,
          status: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Usuario no encontrado',
          },
        };
      }

      if (user.status === 'ACTIVE') {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Usuario ya verificado',
          },
        };
      }

      const verificationCode = emailConfig.generateVerificationCode();
      const verificationCodeExpires = new Date();
      verificationCodeExpires.setMinutes(
        verificationCodeExpires.getMinutes() + 15
      );

      await prisma.users.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpires,
        },
      });

      const emailResult = await emailConfig.sendVerificationEmail(
        user.email,
        user.fullname,
        verificationCode
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: {
            status: 500,
            message: 'Error enviando código de verificación',
          },
        };
      }

      return {
        success: true,
        data: {
          message: 'Código de verificación reenviado exitosamente',
        },
      };
    } catch (error) {
      console.error(
        '[AuthService.resendVerificationCode] unhandled error',
        error
      );
      throw error;
    }
  }

  async verifyToken(
    userId: string,
    allowedRoles?: string[]
  ): Promise<AuthServiceResult> {
    try {
      // Consultar BD para obtener datos REALES del usuario
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          status: true,
          medico: true,
          enfermera: true,
          paciente: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Usuario no encontrado',
          },
        };
      }

      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          error: {
            status: 403,
            message: 'Cuenta de usuario no está activa',
          },
        };
      }

      // Verificar permisos basados en roles (si se especificaron)
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          return {
            success: false,
            error: {
              status: 403,
              message: 'Permisos insuficientes',
            },
          };
        }
      }

      return {
        success: true,
        data: {
          user,
        },
      };
    } catch (error) {
      console.error('[AuthService.verifyToken] unhandled error', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<AuthServiceResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          status: true,
          documentNumber: true,
          phone: true,
          age: true,
          date_of_birth: true,
          medico: true,
          enfermera: true,
          paciente: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Usuario no encontrado',
          },
        };
      }

      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          error: {
            status: 403,
            message: 'Cuenta de usuario no está activa',
          },
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('[AuthService.getUserById] unhandled error', error);
      throw error;
    }
  }
}

export default new AuthService();
