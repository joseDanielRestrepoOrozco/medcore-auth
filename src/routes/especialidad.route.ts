import express from 'express';
import specialtyController from '../controllers/especialidad.controller.js';
import tokenExtractor from '../middleware/tokenExtractor.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(tokenExtractor);

// Rutas para especialidades
router.post('/', specialtyController.createSpecialty);
router.get('/', specialtyController.getAllSpecialties);
router.get(
  '/department/:departmentId',
  specialtyController.getSpecialtiesByDepartment
);
router.get('/:id', specialtyController.getSpecialtyById);
router.put('/:id', specialtyController.updateSpecialty);
router.delete('/:id', specialtyController.deleteSpecialty);

export default router;
