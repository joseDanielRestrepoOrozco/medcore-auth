import { type NextFunction, type Request, type Response } from 'express';
import { specialtySchema } from '../schemas/Auth.js';
import specialtyService from '../services/especialidad.service.js';

/**
 * Crear una nueva especialidad
 */
const createSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const specialtyData = specialtySchema.parse(req.body);
    const result = await specialtyService.createSpecialty(specialtyData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(201).json(result.data);
  } catch (error: unknown) {
    console.error('[createSpecialty] error', error);
    next(error);
  }
};

/**
 * Obtener todas las especialidades
 */
const getAllSpecialties = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await specialtyService.getAllSpecialties();

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getAllSpecialties] error', error);
    next(error);
  }
};

/**
 * Obtener especialidades por departamento
 */
const getSpecialtiesByDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const result = await specialtyService.getSpecialtiesByDepartment(
      departmentId!
    );

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getSpecialtiesByDepartment] error', error);
    next(error);
  }
};

/**
 * Obtener una especialidad por ID
 */
const getSpecialtyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await specialtyService.getSpecialtyById(id!);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getSpecialtyById] error', error);
    next(error);
  }
};

/**
 * Actualizar una especialidad
 */
const updateSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const specialtyData = specialtySchema.partial().parse(req.body);
    const result = await specialtyService.updateSpecialty(id!, specialtyData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[updateSpecialty] error', error);
    next(error);
  }
};

/**
 * Eliminar una especialidad
 */
const deleteSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await specialtyService.deleteSpecialty(id!);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[deleteSpecialty] error', error);
    next(error);
  }
};

export default {
  createSpecialty,
  getAllSpecialties,
  getSpecialtiesByDepartment,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty,
};
