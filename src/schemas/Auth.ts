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

// ============================================
// SCHEMAS PARA TIPOS COMPUESTOS
// ============================================

// Schema para datos de médico (embebido)
export const datosMedicoSchema = z.object({
  specialtyId: z.string().min(1, { message: 'ID de especialidad requerido' }),
  license_number: z.string().min(1, { message: 'Licencia médica requerida' }),
});

// Schema para datos de enfermera (embebido)
export const datosEnfermeraSchema = z.object({
  departmentId: z.string().min(1, { message: 'ID de departamento requerido' }),
});

// Schema para datos de paciente (embebido)
export const datosPacienteSchema = z.object({
  gender: z.string().min(1, { message: 'Género requerido' }),
  address: z.string().optional(),
});

// Schema para datos de administrador (embebido - opcional)
export const datosAdministradorSchema = z.object({
  nivelAcceso: z.string().optional(),
  departamentoAsignado: z.string().optional(),
});

// ============================================
// SCHEMAS BASE Y POR ROL
// ============================================

const baseUser = z.object({
  email: z.email(),
  current_password,
  fullname: z.string().min(1).regex(nameRegex, { message: 'Nombre inválido' }),
  documentNumber: z
    .string()
    .min(1)
    .regex(documentRegex, { message: 'Número de documento inválido' }),
  phone: z.string().optional(),
  date_of_birth: z.iso.date(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).default('PENDING'),
});

export const validateAge = z.number().min(1).max(100);

// Schema para médico con datos embebidos
export const medicoSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.MEDICO),
  medico: datosMedicoSchema,
});

// Schema para enfermera con datos embebidos
export const enfermeraSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.ENFERMERA),
  enfermera: datosEnfermeraSchema,
});

// Schema para paciente con datos embebidos
export const pacienteSchema = baseUser.extend({
  role: z.literal(roleEnumSchema.enum.PACIENTE),
  paciente: datosPacienteSchema,
});

// Schema para administrador (sin datos embebidos por ahora)
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
export type DatosMedico = z.infer<typeof datosMedicoSchema>;
export type DatosEnfermera = z.infer<typeof datosEnfermeraSchema>;
export type DatosPaciente = z.infer<typeof datosPacienteSchema>;
export type DatosAdministrador = z.infer<typeof datosAdministradorSchema>;

// ============================================
// SCHEMAS PARA AUTENTICACIÓN
// ============================================

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

// ============================================
// SCHEMAS PARA DEPARTAMENTOS Y ESPECIALIDADES
// ============================================

export const departmentSchema = z.object({
  name: z.string().min(1, { message: 'Nombre del departamento requerido' }),
  description: z.string().optional(),
});

export const specialtySchema = z.object({
  name: z.string().min(1, { message: 'Nombre de la especialidad requerido' }),
  description: z.string().optional(),
  departmentId: z.string().min(1, { message: 'ID del departamento requerido' }),
});

export type Department = z.infer<typeof departmentSchema>;
export type Specialty = z.infer<typeof specialtySchema>;
