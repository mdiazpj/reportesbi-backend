import cca from '../config/msalConfig.js';
import { getToken, loginUser } from '../services/authService.js';
import { getEmbedToken, getEmbedTokenMulti, getEmbedTokenMultiRol } from '../services/azureAuthService.js';

export const login = async (req, res) => {
  const { email } = req.body;

  // Captura la dirección IP y el User-Agent
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    const token = await loginUser(email, ipAddress, userAgent);
    if (!token) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ token });
  } catch (error) {
    console.error('Error en el proceso de login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
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


export const authenticateMultipleReports = async (req, res) => {
  try {
    const { reports } = req.body;
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: 'reports es requerido y debe ser un arreglo' });
    }

    // Extrae los reportIds y groupIds
    const reportConfigs = reports.map(r => ({
      reportId: r.reportId,
      groupId: r.groupId,
    }));

    // Extrae las identidades si están presentes
    const tokenData = await getEmbedTokenMulti(reportConfigs);

    res.json({
      embedToken: tokenData.embedToken,
      reports: tokenData.reports,
      groupId: tokenData.groupId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en la autenticación múltiple', details: error.message });
  }
};

export const authenticateMultpipleRol = async (req, res) => {
  try {
    const { reports } = req.body;
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: 'reports es requerido y debe ser un arreglo' });
    }

    // Extrae los reportIds y groupIds
    const reportConfigs = reports.map(r => ({
      reportId: r.reportId,
      groupId: r.groupId,
    }));

    // Extrae las identidades si están presentes
    const tokenData = await getEmbedTokenMultiRol(reportConfigs, req.body.userInfo);

    res.json({
      embedToken: tokenData.embedToken,
      reports: tokenData.reports,
      groupId: tokenData.groupId,
      identities: tokenData.identities 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en la autenticación múltiple', details: error.message });
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
    res.redirect(`https://reportespowerbi.ti-pjchile.com/#/home?token=${token}`); // Pasa el token al frontend
  } catch (error) {
    console.error('Error al intercambiar el código de autorización por token:', error);
    res.status(500).json({ message: 'Error en la autenticación', error: error.message });
  }
};