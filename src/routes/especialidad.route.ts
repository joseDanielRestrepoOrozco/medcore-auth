import express from 'express';
import especialtyController from '../controllers/especialidad.controller.js';
import tokenExtractor from '../middleware/tokenExtractor.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(tokenExtractor);

// Rutas para especialidades
router.post('/', especialtyController.createEspecialty);
router.get('/', especialtyController.getAllEspecialties);
router.get(
  '/department/:departmentId',
  especialtyController.getEspecialtiesByDepartment
);
router.get('/:id', especialtyController.getEspecialtyById);
router.put('/:id', especialtyController.updateEspecialty);
router.delete('/:id', especialtyController.deleteEspecialty);

export default router;
