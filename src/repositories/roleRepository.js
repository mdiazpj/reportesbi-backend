import pool from '../config/db.js';

export const assignRoleToUser = async (userId, roleId, performedByUserId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO bi_user_role (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );

    await connection.query(
      `INSERT INTO bi_user_role_trace (user_id, role_id, action_type, performed_by_user_id)
       VALUES (?, ?, 'ASSIGN', ?)`,
      [userId, roleId, performedByUserId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const userHasRole = async (userId, roleName) => {
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM bi_user_role ur
    JOIN bi_role r ON ur.role_id = r.role_id
    WHERE ur.user_id = ? AND r.role_name = ?
  `, [userId, roleName]);

  return rows[0].count > 0;
};

export const getRoleNameById = async (roleId) => {
  const [rows] = await pool.query('SELECT role_name FROM bi_role WHERE role_id = ?', [roleId]);
  return rows[0]?.role_name || null;
};

/**
 * Elimina un rol de un usuario.
 * @param {number} userId - ID del usuario.
 * @param {number} roleId - ID del rol que se desea eliminar.
 * @returns {Promise<boolean>} Retorna `true` si el rol fue eliminado, `false` en caso contrario.
 */
export const removeUserRole = async (userId, roleId) => {
  console.log(`Intentando eliminar rol con roleId: ${roleId} para userId: ${userId}`);
  
  const [result] = await pool.query(
    'DELETE FROM bi_user_role WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );

  console.log(`Resultado de eliminación: `, result);

  // Verificar el número de filas afectadas
  if (result.affectedRows === 0) {
    console.error(`No se encontró un rol con roleId: ${roleId} para el userId: ${userId}.`);
  }

  return result.affectedRows > 0;
};

// Función para asignar un rol a un usuario y registrar en la trazabilidad
export const assignNewUserRole = async (userId, roleId, performedByUserId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Asignar nuevo rol
    await connection.query(
      'INSERT INTO bi_user_role (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );

    // Registrar en la trazabilidad la acción de "EDIT"
    await connection.query(
      `INSERT INTO bi_user_role_trace (user_id, role_id, action_type, performed_by_user_id)
       VALUES (?, ?, 'EDIT', ?)`,
      [userId, roleId, performedByUserId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};




/**
 * Elimina una asignación de rol de un usuario.
 * @param {number} userId - ID del usuario.
 * @param {number} roleId - ID del rol a eliminar.
 */
export const deleteUserRole = async (userId, roleId) => {
  await pool.query('DELETE FROM bi_user_role WHERE user_id = ? AND role_id = ?', [userId, roleId]);
};

/**
 * Registra una acción de eliminación de rol en la trazabilidad.
 * @param {number} userId - ID del usuario al que se le eliminó el rol.
 * @param {number} roleId - ID del rol eliminado.
 * @param {number} performedByUserId - ID del usuario que realiza la eliminación.
 */
export const logRoleRemoval = async (userId, roleId, performedByUserId) => {
  await pool.query(
    `INSERT INTO bi_user_role_trace (user_id, role_id, action_type, performed_by_user_id)
     VALUES (?, ?, 'REMOVE', ?)`,
    [userId, roleId, performedByUserId]
  );
};

