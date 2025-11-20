import { type NextFunction, type Request, type Response } from 'express';
import { departmentSchema } from '../schemas/Auth.js';
import departmentService from '../services/departamento.service.js';

/**
 * Crear un nuevo departamento
 */
const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentData = departmentSchema.parse(req.body);
    const result = await departmentService.createDepartment(departmentData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(201).json(result.data);
  } catch (error: unknown) {
    console.error('[createDepartment] error', error);
    next(error);
  }
};

/**
 * Obtener todos los departamentos
 */
const getAllDepartments = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await departmentService.getAllDepartments();

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getAllDepartments] error', error);
    next(error);
  }
};

/**
 * Obtener un departamento por ID
 */
const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de departamento requerido' });
      return;
    }

    const result = await departmentService.getDepartmentById(id);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[getDepartmentById] error', error);
    next(error);
  }
};

/**
 * Actualizar un departamento
 */
const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de departamento requerido' });
      return;
    }

    const departmentData = departmentSchema.partial().parse(req.body);
    const result = await departmentService.updateDepartment(id, departmentData);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[updateDepartment] error', error);
    next(error);
  }
};

/**
 * Eliminar un departamento
 */
const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de departamento requerido' });
      return;
    }

    const result = await departmentService.deleteDepartment(id);

    if (!result.success) {
      res.status(result.error!.status).json({ error: result.error!.message });
      return;
    }

    res.status(200).json(result.data);
  } catch (error: unknown) {
    console.error('[deleteDepartment] error', error);
    next(error);
  }
};

export default {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
