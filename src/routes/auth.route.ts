import express from 'express';
import authController from '../controllers/auth.controller.js';
import tokenExtractor from '../middleware/tokenExtractor.js';
const router = express.Router();

router.post('/sign-up', authController.signup);
router.post('/log-in', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification-code', authController.resendVerificationCode);
router.get('/verify-token', tokenExtractor, authController.verifyToken);

export default router;
