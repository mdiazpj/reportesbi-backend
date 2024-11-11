import cca from '../config/msalConfig.js';
import { getToken, loginUser } from '../services/authService.js';
import { getEmbedToken } from '../services/azureAuthService.js';

export const login = async (req, res) => {
  const { email } = req.body;
  const token = await loginUser(email);
  if (!token) return res.status(401).json({ error: 'User not found' });

  res.json({ token });
};

export const authenticateUser = async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ error: 'reportId es requerido' });
    }

    const tokenData = await getEmbedToken(reportId);
    res.json({
      embedToken: tokenData.embedToken,
      reportId: tokenData.reportId,
      groupId: tokenData.groupId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en la autenticación', details: error.message });
  }
};

// Redirigir al usuario al portal de autenticación de Azure AD
export const redirectToAuthCode = async (req, res) => {
  const authCodeUrlParameters = {
    scopes: ['User.Read.All'], // Scopes necesarios para acceder a los usuarios de Azure AD
    redirectUri: process.env.AZURE_AD_REDIRECT_URI, // URI donde Azure redirige después de la autenticación
  };

  try {
    const authCodeUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(authCodeUrl); // Redirigir al usuario a la página de autenticación de Azure AD
  } catch (error) {
    console.error('Error al obtener la URL de autenticación:', error);
    res.status(500).json({ message: 'Error en el proceso de autenticación', error: error.message });
  }
};

// Manejar la redirección desde Azure AD y obtener el token de acceso (JWT)
export const handleAuthRedirect = async (req, res) => {
  const authCode = req.query.code;

  if (!authCode) {
    return res.status(400).json({ message: 'Código de autorización no presente' });
  }

  try {
    // Obtener el token de acceso
    const token = await getToken(authCode);

    // Redirigir al frontend con el token, puedes almacenarlo en el frontend para futuras solicitudes
    res.redirect(`http://localhost:4200/#/home?token=${token}`); // Pasa el token al frontend
  } catch (error) {
    console.error('Error al intercambiar el código de autorización por token:', error);
    res.status(500).json({ message: 'Error en la autenticación', error: error.message });
  }
};