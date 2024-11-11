import { assignNewUserRole, assignRoleToUser, deleteUserRole, getRoleNameById, logRoleRemoval, removeUserRole, userHasRole } from '../repositories/roleRepository.js';
import { getUserRoles, getUsersWithoutRoles, getUsersWithSharedRoles } from '../repositories/userRepository.js';

/**
 * Verifica si el usuario autenticado tiene un rol específico.
 * @param {Object} userRoles Lista de roles del usuario.
 * @param {string} roleName Nombre del rol a verificar.
 * @returns {boolean} Retorna `true` si el usuario tiene el rol.
 */
const userHasRoleByName = (userRoles, roleName) => {
  return userRoles.some(role => role.role_name === roleName);
};

/**
 * Asigna un rol a un usuario con verificación de permisos.
 * @param {Object} currentUser Usuario actual autenticado.
 * @param {number} userId ID del usuario al que se asignará el rol.
 * @param {number} roleId ID del rol a asignar.
 * @returns {Promise<Object>} Resultado de la operación.
 */
export const assignRole = async (currentUser, userId, roleId) => {
  const roleNameToAssign = await getRoleNameById(roleId);
  if (roleNameToAssign === 'Asignador') {
    return { success: false, error: 'No se permite asignar el rol "Asignador" a otros usuarios' };
  }

  // Verifica si el usuario actual tiene el rol "Asignador"
  if (!userHasRoleByName(currentUser.roles, 'Asignador')) {
    return { success: false, error: 'El usuario no tiene el rol necesario para realizar asignaciones (Asignador)' };
  }

  // Verifica si el usuario actual tiene el rol que quiere asignar
  if (!userHasRoleByName(currentUser.roles, roleNameToAssign)) {
    return { success: false, error: `El usuario no tiene el rol necesario (${roleNameToAssign}) para asignarlo a otros` };
  }

  // Procede a la asignación
  await assignRoleToUser(userId, roleId, currentUser.userId);
  return { success: true };
};

/**
 * Obtiene usuarios con roles en común, excluyendo el rol "Asignador".
 * Solo accesible si el usuario tiene el rol "Asignador".
 * 
 * @param {Object} currentUser Usuario actual autenticado.
 * @returns {Promise<Object>} Lista de usuarios o un mensaje de error.
 */
export const getSharedRoleUsers = async (currentUser) => {
  if (!userHasRoleByName(currentUser.roles, 'Asignador')) {
    return { success: false, error: 'El usuario no tiene permiso para acceder a esta información' };
  }

  const users = await getUsersWithSharedRoles(currentUser.userId, currentUser.roles);
  return { success: true, users };
};


/**
 * Edita un rol asignado a un usuario específico.
 * @param {Object} currentUser Usuario actual autenticado.
 * @param {number} userId ID del usuario al que se le modificará el rol.
 * @param {number} currentRoleId ID del rol actual que se desea cambiar.
 * @param {number} newRoleId ID del nuevo rol a asignar.
 * @returns {Promise<Object>} Resultado de la operación.
 */
export const editUserRole = async (currentUser, userId, currentRoleId, newRoleId) => {
  try {
    // Verificar si el rol actual está realmente asignado al usuario
    const roleAssigned = await removeUserRole(userId, currentRoleId);

    if (!roleAssigned) {
      console.error(`No se encontró un rol con roleId: ${currentRoleId} para el userId: ${userId}.`);
      return { success: false, error: 'No se pudo eliminar el rol actual del usuario.' };
    }

    // Asigna el nuevo rol
    await assignNewUserRole(userId, newRoleId, currentUser.userId);
    return { success: true, message: 'Role updated successfully' };

  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el rol del usuario.' };
  }
};


/**
 * Elimina una asignación de rol específica de un usuario.
 * @param {Object} currentUser - Usuario actual autenticado.
 * @param {number} userId - ID del usuario al que se le eliminará el rol.
 * @param {number} roleId - ID del rol que se desea eliminar.
 * @returns {Promise<Object>} Resultado de la operación.
 */
export const removeUserRoleA = async (currentUser, userId, roleId) => {
  if (!userHasRoleByName(currentUser.roles, 'Asignador')) {
    return { success: false, error: 'El usuario no tiene permiso de Asignador para realizar esta acción' };
  }

  const roleName = await getRoleNameById(roleId);
  const hasRole = await userHasRole(userId, roleName);
  if (!hasRole) {
    return { success: false, error: `El usuario no tiene el rol ${roleName} asignado` };
  }

  await deleteUserRole(userId, roleId);
  await logRoleRemoval(userId, roleId, currentUser.userId);

  return { success: true, message: 'Role removed successfully' };
};

/**
 * Obtiene usuarios sin roles asignados.
 * @returns {Promise<Object>} Lista de usuarios sin roles o un mensaje de error.
 */
export const getUsersWithoutAssignedRoles = async () => {
  const users = await getUsersWithoutRoles();
  return { success: true, users };
};

/**
 * Obtiene los roles disponibles que el usuario autenticado puede asignar,
 * excluyendo el rol "Asignador".
 * @param {Object} currentUser - Usuario actual autenticado.
 * @returns {Promise<Array>} - Lista de roles con `role_id` y `role_name`.
 */
export const getAvailableRolesService = async (currentUser) => {
  const availableRoles = currentUser.roles.filter(role => role.role_name !== 'Asignador');
  return availableRoles;
};