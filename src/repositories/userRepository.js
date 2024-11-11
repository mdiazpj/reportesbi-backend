import pool from '../config/db.js';

export const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM bi_user WHERE email = ?', [email]);
  return rows[0] || null;
};

/**
 * Obtiene los roles (id y nombre) del usuario autenticado.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array>} - Lista de roles con `role_id` y `role_name`.
 */
export const getUserRoles = async (userId) => {
  const [rows] = await pool.query(`
    SELECT r.role_id, r.role_name
    FROM bi_role r
    JOIN bi_user_role ur ON r.role_id = ur.role_id
    WHERE ur.user_id = ?
  `, [userId]);

  return rows; // Devuelve una lista de objetos con `role_id` y `role_name`
};

/**
 * Obtiene todos los usuarios que comparten roles con el usuario autenticado,
 * excluyendo a aquellos que tienen el rol "Asignador".
 * 
 * @param {number} userId ID del usuario autenticado
 * @param {Array<Object>} userRoles Roles del usuario autenticado, como objetos con `role_id` y `role_name`
 * @returns {Promise<Array<Object>>} Lista de usuarios con roles en común
 */
export const getUsersWithSharedRoles = async (userId, userRoles) => {
  // Filtra los roles del usuario autenticado, excluyendo el rol "Asignador"
  const rolesToFilter = userRoles
    .filter(role => role.role_name !== 'Asignador')
    .map(role => role.role_name);

  if (rolesToFilter.length === 0) return []; // Si no hay roles para filtrar, devuelve una lista vacía.

  const [rows] = await pool.query(`
    SELECT u.user_id, u.name, u.email, 
           JSON_ARRAYAGG(JSON_OBJECT('role_id', r.role_id, 'role_name', r.role_name)) AS roles
    FROM bi_user u
    JOIN bi_user_role ur ON u.user_id = ur.user_id
    JOIN bi_role r ON ur.role_id = r.role_id
    WHERE r.role_name IN (?)              -- Roles en común con el usuario autenticado
      AND u.user_id != ?                  -- Excluir al propio usuario
      AND u.user_id NOT IN (              -- Excluir usuarios que tengan el rol "Asignador"
        SELECT ur2.user_id
        FROM bi_user_role ur2
        JOIN bi_role r2 ON ur2.role_id = r2.role_id
        WHERE r2.role_name = 'Asignador'
      )
    GROUP BY u.user_id
  `, [rolesToFilter, userId]);

  // Retornar los resultados sin parseo adicional
  return rows.map(user => ({
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    roles: user.roles // No usar JSON.parse aquí, MySQL ya devuelve el JSON correctamente
  }));
};

/**
 * Obtiene todos los usuarios que no tienen ningún rol asignado.
 * @returns {Promise<Array<Object>>} Lista de usuarios sin roles.
 */
export const getUsersWithoutRoles = async () => {
  const [rows] = await pool.query(`
    SELECT u.user_id, u.name, u.email
    FROM bi_user u
    LEFT JOIN bi_user_role ur ON u.user_id = ur.user_id
    WHERE ur.role_id IS NULL
  `);

  return rows;
};



