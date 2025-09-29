import { Router } from 'express';
import { login, refreshToken } from '../controllers/authController';
import { authValidator } from '../validators';

const router: Router = Router();

router.post('/login',
	authValidator.validateLogin,
	login
);
router.post('/refresh',
	authValidator.validateRefreshToken,
	refreshToken
);

export default router;
