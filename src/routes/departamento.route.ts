import express from 'express';
import departmentController from '../controllers/departamento.controller.js';
import tokenExtractor from '../middleware/tokenExtractor.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(tokenExtractor);

// Rutas para departamentos
router.post('/', departmentController.createDepartment);
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;
