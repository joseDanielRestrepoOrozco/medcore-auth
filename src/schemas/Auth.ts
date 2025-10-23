import { z } from 'zod';

const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const documentRegex = /^\d+$/;

const current_password = z
  .string()
  .min(6, { message: 'Debe tener al menos 6 caracteres' })
  .refine(val => /\d/.test(val), {
    message: 'Debe contener al menos un número',
  });

const roleEnumSchema = z.enum([
  'MEDICO',
  'ENFERMERA',
  'PACIENTE',
  'ADMINISTRADOR',
]);

const baseUser = z.object({
  email: z.email(),
  current_password,
  fullname: z.string().min(1).regex(nameRegex, { message: 'Nombre inválido' }),
  phone: z.string().optional(),
  date_of_birth: z.iso.date(),
  gender: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).default('PENDING'),
});

export const validateAge = z.number().min(1).max(100);

export const medicoSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.MEDICO),
  specialization: z.string(),
  department: z.string(),
  license_number: z.string(),
});

export const enfermeraSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.ENFERMERA),
  department: z.string(),
});

export const pacienteSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.PACIENTE),
});

export const administradorSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.ADMINISTRADOR),
});

export const userSchema = z.discriminatedUnion('role', [
  medicoSchema,
  enfermeraSchema,
  pacienteSchema,
  administradorSchema,
]);

export type User = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  email: z.email(),
  current_password,
});

export const verifyEmailSchema = z.object({
  email: z.email(),
  verificationCode: z
    .string()
    .length(6, { message: 'Código inválido' })
    .regex(documentRegex, { message: 'Código inválido' }),
});

export const resendVerificationCodeSchema = z.object({
  email: z.email(),
});
