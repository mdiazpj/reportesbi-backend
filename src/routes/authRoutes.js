import express from 'express';
import { authenticateUser, handleAuthRedirect, login, redirectToAuthCode,authenticateMultipleReports,authenticateMultpipleRol } from '../controllers/authController.js';

const router = express.Router();
router.post('/login', login);
router.post('/auth', authenticateUser); // Nueva ruta de autenticación

// Ruta para iniciar el proceso de autenticación (redirección al portal de Azure AD)
router.get('/loginAD', redirectToAuthCode);

// Ruta para manejar la redirección después de la autenticación y obtener el token
router.get('/callback', handleAuthRedirect);

//pruebas de autenticación múltiple de reportes Power BI
// Ruta para autenticación múltiple de reportes Power BI
router.post('/auth/multiple', authenticateMultipleReports);

router.post('/auth/multipleRol', authenticateMultpipleRol);


export default router;
