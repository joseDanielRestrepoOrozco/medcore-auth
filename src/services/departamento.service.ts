import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { departmentSchema } from '../schemas/Auth.js';

type DepartmentInput = z.infer<typeof departmentSchema>;

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

class DepartmentService {
  /**
   * Crear un nuevo departamento
   */
  async createDepartment(
    departmentData: DepartmentInput
  ): Promise<ServiceResult> {
    try {
      // Verificar si ya existe un departamento con ese nombre
      const exists = await prisma.department.findUnique({
        where: { name: departmentData.name },
      });

      if (exists) {
        return {
          success: false,
          error: {
            status: 400,
            message: 'Ya existe un departamento con ese nombre',
          },
        };
      }

      const department = await prisma.department.create({
        data: departmentData,
      });

      return {
        success: true,
        data: department,
      };
    } catch (error) {
      console.error('[DepartmentService.create] error:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los departamentos
   */
  async getAllDepartments(): Promise<ServiceResult> {
    try {
      const departments = await prisma.department.findMany({
        include: {
          specialties: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: departments,
      };
    } catch (error) {
      console.error('[DepartmentService.getAll] error:', error);
      throw error;
    }
  }

  /**
   * Obtener un departamento por ID
   */
  async getDepartmentById(id: string): Promise<ServiceResult> {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          specialties: true,
        },
      });

      if (!department) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Departamento no encontrado',
          },
        };
      }

      return {
        success: true,
        data: department,
      };
    } catch (error) {
      console.error('[DepartmentService.getById] error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un departamento
   */
  async updateDepartment(
    id: string,
    departmentData: Partial<DepartmentInput>
  ): Promise<ServiceResult> {
    try {
      const department = await prisma.department.update({
        where: { id },
        data: departmentData,
      });

      return {
        success: true,
        data: department,
      };
    } catch (error) {
      console.error('[DepartmentService.update] error:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Departamento no encontrado',
          },
        };
      }
      throw error;
    }
  }

  /**
   * Eliminar un departamento
   */
  async deleteDepartment(id: string): Promise<ServiceResult> {
    try {
      // Verificar si el departamento tiene especialidades asociadas
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          specialties: true,
        },
      });

      if (!department) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'Departamento no encontrado',
          },
        };
      }

      if (department.specialties.length > 0) {
        return {
          success: false,
          error: {
            status: 400,
            message:
              'No se puede eliminar un departamento con especialidades asociadas',
          },
        };
      }

      await prisma.department.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: 'Departamento eliminado exitosamente' },
      };
    } catch (error) {
      console.error('[DepartmentService.delete] error:', error);
      throw error;
    }
  }
}

export default new DepartmentService();
