import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { especialtySchema } from '../schemas/Auth.js';

type EspecialtyInput = z.infer<typeof especialtySchema>;

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

class EspecialtyService {
  /**
   * Crear una nueva especialidad
   */
  async createEspecialty(
    especialtyData: EspecialtyInput
  ): Promise<ServiceResult> {
    try {
      // Verificar que el departamento existe
      const departmentExists = await prisma.department.findUnique({
        where: { id: especialtyData.departmentId },
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
      const exists = await prisma.especialty.findUnique({
        where: { name: especialtyData.name },
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

      const especialty = await prisma.especialty.create({
        data: especialtyData,
        include: {
          department: true,
        },
      });

      return {
        success: true,
        data: especialty,
      };
    } catch (error) {
      console.error('[EspecialtyService.create] error:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las especialidades
   */
  async getAllEspecialties(): Promise<ServiceResult> {
    try {
      const especialties = await prisma.especialty.findMany({
        include: {
          department: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: especialties,
      };
    } catch (error) {
      console.error('[EspecialtyService.getAll] error:', error);
      throw error;
    }
  }

  /**
   * Obtener especialidades por departamento
   */
  async getEspecialtiesByDepartment(
    departmentId: string
  ): Promise<ServiceResult> {
    try {
      const especialties = await prisma.especialty.findMany({
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
        data: especialties,
      };
    } catch (error) {
      console.error('[EspecialtyService.getByDepartment] error:', error);
      throw error;
    }
  }

  /**
   * Obtener una especialidad por ID
   */
  async getEspecialtyById(id: string): Promise<ServiceResult> {
    try {
      const especialty = await prisma.especialty.findUnique({
        where: { id },
        include: {
          department: true,
        },
      });

      if (!especialty) {
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
        data: especialty,
      };
    } catch (error) {
      console.error('[EspecialtyService.getById] error:', error);
      throw error;
    }
  }

  /**
   * Actualizar una especialidad
   */
  async updateEspecialty(
    id: string,
    especialtyData: Partial<EspecialtyInput>
  ): Promise<ServiceResult> {
    try {
      if (especialtyData.departmentId) {
        const departmentExists = await prisma.department.findUnique({
          where: { id: especialtyData.departmentId },
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

      const especialty = await prisma.especialty.update({
        where: { id },
        data: especialtyData,
        include: {
          department: true,
        },
      });

      return {
        success: true,
        data: especialty,
      };
    } catch (error) {
      console.error('[EspecialtyService.update] error:', error);
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
  async deleteEspecialty(id: string): Promise<ServiceResult> {
    try {
      await prisma.especialty.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: 'Especialidad eliminada exitosamente' },
      };
    } catch (error) {
      console.error('[EspecialtyService.delete] error:', error);
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

export default new EspecialtyService();
