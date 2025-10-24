import express from 'express';
const router = express.Router();
import authRouter from './auth.route.js';
import departmentRouter from './departamento.route.js';
import especialtyRouter from './especialidad.route.js';

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/especialties', especialtyRouter);

export default router;
