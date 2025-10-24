import { type NextFunction, type Request, type Response } from 'express';
import { especialtySchema } from '../schemas/Auth.js';
import especialtyService from '../services/especialidad.service.js';

/**
 * Crear una nueva especialidad
 */
const createEspecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const especialtyData = especialtySchema.parse(req.body);
    const result = await especialtyService.createEspecialty(especialtyData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(201).json(result.data);
  } catch (error: unknown) {
    console.error('[createEspecialty] error', error);
    next(error);
  }
};

/**
 * Obtener todas las especialidades
 */
const getAllEspecialties = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await especialtyService.getAllEspecialties();

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getAllEspecialties] error', error);
    next(error);
  }
};

/**
 * Obtener especialidades por departamento
 */
const getEspecialtiesByDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const result = await especialtyService.getEspecialtiesByDepartment(
      departmentId!
    );

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getEspecialtiesByDepartment] error', error);
    next(error);
  }
};

/**
 * Obtener una especialidad por ID
 */
const getEspecialtyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await especialtyService.getEspecialtyById(id!);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getEspecialtyById] error', error);
    next(error);
  }
};

/**
 * Actualizar una especialidad
 */
const updateEspecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const especialtyData = especialtySchema.partial().parse(req.body);
    const result = await especialtyService.updateEspecialty(
      id!,
      especialtyData
    );

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[updateEspecialty] error', error);
    next(error);
  }
};

/**
 * Eliminar una especialidad
 */
const deleteEspecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await especialtyService.deleteEspecialty(id!);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[deleteEspecialty] error', error);
    next(error);
  }
};

export default {
  createEspecialty,
  getAllEspecialties,
  getEspecialtiesByDepartment,
  getEspecialtyById,
  updateEspecialty,
  deleteEspecialty,
};
