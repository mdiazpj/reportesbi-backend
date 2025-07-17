import express from 'express';
import { assignUserRole, deleteUserRole, getAllUsersController, getAvailableRolesController, getUsersBySharedRoles, getUsersWithoutRoles, updateUserRole } from '../controllers/roleController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { getDatasetRoles } from '../controllers/rolesController.js';

const router = express.Router();
router.post('/assign', authenticateJWT, assignUserRole);
router.get('/shared-roles', authenticateJWT, getUsersBySharedRoles);
router.patch('/update-role', authenticateJWT, updateUserRole);
router.delete('/delete-role', authenticateJWT, deleteUserRole);
router.get('/no-role-users', authenticateJWT, getUsersWithoutRoles);  // Endpoint para obtener usuarios sin roles
router.get('/available', authenticateJWT, getAvailableRolesController); // Endpoint protegido con el middleware `authenticateJWT`
router.get('/all-users', authenticateJWT, getAllUsersController);
router.post('/roles', getDatasetRoles);
export default router;
