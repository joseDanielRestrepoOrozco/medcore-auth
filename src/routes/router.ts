import express from 'express';
const router = express.Router();
import authRouter from './auth.route.js';
import departmentRouter from './departamento.route.js';
import specialtyRouter from './especialidad.route.js';

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/specialties', specialtyRouter);

export default router;
