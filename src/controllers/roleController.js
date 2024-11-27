import { assignRole, editUserRole, getAllUsersService, getAvailableRolesService, getSharedRoleUsers, getUsersWithoutAssignedRoles, removeUserRoleA } from '../services/roleService.js';


/**
 * Asigna un rol a un usuario con verificación de permisos.
 */
export const assignUserRole = async (req, res) => {
  const { userId, roleId } = req.body;
  const { user } = req;

  try {
    const result = await assignRole(user, userId, roleId);
    if (!result.success) return res.status(403).json({ error: result.error });

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error assigning role' });
  }
};

/**
 * Obtiene usuarios con roles en común, excluyendo el rol "Asignador".
 */
export const getUsersBySharedRoles = async (req, res) => {
  const { user } = req;

  try {
    const result = await getSharedRoleUsers(user);
    if (!result.success) return res.status(403).json({ error: result.error });

    res.json({ users: result.users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving shared role users' });
  }
};

export const updateUserRole = async (req, res) => {
  const { user } = req;
  const { userId, currentRoleId, newRoleId } = req.body;

  // Log para verificar los datos entrantes
  console.log('Datos recibidos para actualizar rol:', { userId, currentRoleId, newRoleId });

  if (!userId || !currentRoleId || !newRoleId) {
    return res.status(400).json({ error: "userId, currentRoleId, y newRoleId son requeridos" });
  }

  const result = await editUserRole(user, userId, currentRoleId, newRoleId);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }

  res.json({ message: result.message });
};

/**
 * Elimina una asignación de rol de un usuario.
 */
export const deleteUserRole = async (req, res) => {
  const { user } = req;
  const { userId, roleId } = req.body;

  try {
    const result = await removeUserRoleA(user, userId, roleId);
    if (!result.success) return res.status(403).json({ error: result.error });

    res.json({ message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting role' });
  }
};

/**
 * Obtiene usuarios sin roles asignados.
 */
export const getUsersWithoutRoles = async (req, res) => {
  try {
    const result = await getUsersWithoutAssignedRoles();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving users without roles' });
  }
};

/**
 * Devuelve una lista de roles disponibles que el usuario autenticado puede asignar.
 */
export const getAvailableRolesController = async (req, res) => {
  const { user } = req;

  try {
    // Llama al servicio para obtener los roles disponibles para el usuario autenticado
    const roles = await getAvailableRolesService(user);
    res.json({ roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving available roles' });
  }
};


/**
 * Controlador para obtener todos los usuarios junto con sus roles.
 */
export const getAllUsersController = async (req, res) => {
  try {
    const result = await getAllUsersService();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ users: result.users });
  } catch (error) {
    console.error('Error in getAllUsersController:', error);
    res.status(500).json({ error: 'Error retrieving all users' });
  }
};