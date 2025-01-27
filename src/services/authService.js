import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserByEmail, getUserRoles } from '../repositories/userRepository.js';
import cca from '../config/msalConfig.js';
import pool from '../config/db.js';



dotenv.config();

export const loginUser = async (email, ipAddress, userAgent) => {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const roles = await getUserRoles(user.user_id);

  const token = jwt.sign(
    {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Registrar el inicio de sesión en la tabla bi_user_login_trace con el correo electrónico
  await pool.query(`
    INSERT INTO bi_user_login_trace (user_id, email, ip_address, user_agent) 
    VALUES (?, ?, ?, ?)
  `, [user.user_id, user.email, ipAddress, userAgent]);

  return token;
};

export const getToken = async (authCode) => {
  try {
    if (!authCode) {
      throw new Error('No se proporcionó el código de autorización');
    }

    // Intercambia el código de autorización por un token de acceso
    const tokenResponse = await cca.acquireTokenByCode({
      code: authCode, // Código de autorización recibido
      scopes: ['User.Read.All'], // Scope actualizado para leer todos los usuarios
      redirectUri: process.env.AZURE_AD_REDIRECT_URI, // URI de redirección configurada
    });

    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('No se pudo obtener el token de acceso');
    }

    // Devuelve el token de acceso (JWT)
    return tokenResponse.accessToken;
  } catch (error) {
    console.error('Error al obtener el token de acceso:', error.message);
    throw new Error('Error de autenticación');
  }
};

