import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { specialtySchema } from '../schemas/Auth.js';

type SpecialtyInput = z.infer<typeof specialtySchema>;

const prisma = new PrismaClient();

interface ServiceResult {
  success: boolean;
  error?: {
    status: number;
    message: string;
  };
  data?: unknown;
}

interface PrismaError extends Error {
  code?: string;
}

class SpecialtyService {
  /**
   * Crear una nueva especialidad
   */
  async createSpecialty(specialtyData: SpecialtyInput): Promise<ServiceResult> {
    try {
      // Verificar que el departamento existe
      const departmentExists = await prisma.department.findUnique({
        where: { id: specialtyData.departmentId },
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

      // Verificar si ya existe una especialidad con ese nombre
      const exists = await prisma.specialty.findUnique({
        where: { name: specialtyData.name },
      });

      if (exists) {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Ya existe una especialidad con ese nombre',
          },
        };
      }

      const specialty = await prisma.specialty.create({
        data: specialtyData,
        include: {
          department: true,
        },
      });

      return {
        success: true,
        data: specialty,
      };
    } catch (error) {
      console.error('[SpecialtyService.create] error:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las especialidades
   */
  async getAllSpecialties(): Promise<ServiceResult> {
    try {
      const specialties = await prisma.specialty.findMany({
        include: {
          department: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: specialties,
      };
    } catch (error) {
      console.error('[SpecialtyService.getAll] error:', error);
      throw error;
    }
  }

  /**
   * Obtener especialidades por departamento
   */
  async getSpecialtiesByDepartment(
    departmentId: string
  ): Promise<ServiceResult> {
    try {
      const specialties = await prisma.specialty.findMany({
        where: { departmentId },
        include: {
          department: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: specialties,
      };
    } catch (error) {
      console.error('[SpecialtyService.getByDepartment] error:', error);
      throw error;
    }
  }

  /**
   * Obtener una especialidad por ID
   */
  async getSpecialtyById(id: string): Promise<ServiceResult> {
    try {
      const specialty = await prisma.specialty.findUnique({
        where: { id },
        include: {
          department: true,
        },
      });

      if (!specialty) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Especialidad no encontrada',
          },
        };
      }

      return {
        success: true,
        data: specialty,
      };
    } catch (error) {
      console.error('[SpecialtyService.getById] error:', error);
      throw error;
    }
  }

  /**
   * Actualizar una especialidad
   */
  async updateSpecialty(
    id: string,
    specialtyData: Partial<SpecialtyInput>
  ): Promise<ServiceResult> {
    try {
      if (specialtyData.departmentId) {
        const departmentExists = await prisma.department.findUnique({
          where: { id: specialtyData.departmentId },
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

      const specialty = await prisma.specialty.update({
        where: { id },
        data: specialtyData,
        include: {
          department: true,
        },
      });

      return {
        success: true,
        data: specialty,
      };
    } catch (error) {
      console.error('[SpecialtyService.update] error:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Especialidad no encontrada',
          },
        };
      }
      throw error;
    }
  }

  /**
   * Eliminar una especialidad
   */
  async deleteSpecialty(id: string): Promise<ServiceResult> {
    try {
      await prisma.specialty.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: 'Especialidad eliminada exitosamente' },
      };
    } catch (error) {
      console.error('[SpecialtyService.delete] error:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Especialidad no encontrada',
          },
        };
      }
      throw error;
    }
  }
}

export default new SpecialtyService();
