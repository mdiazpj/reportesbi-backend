// services/azureAuthService.js
import axios from 'axios';
import { ConfidentialClientApplication } from '@azure/msal-node';
import config from '../config/config.js';

const msalConfig = {
  auth: {
    clientId: config.clientId,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
    clientSecret: config.clientSecret,
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

export const getEmbedToken = async (reportId) => {
  try {
    const result = await cca.acquireTokenByUsernamePassword({
      scopes: [config.scope],
      username: config.username,
      password: config.password,
    });

    const accessToken = result.accessToken;

    if (!accessToken) {
      throw new Error("No se pudo extraer el access token");
    }

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${config.groupId}/reports/${reportId}/GenerateToken`;

    const embedResponse = await axios.post(
      url,
      { accessLevel: 'View' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const embedToken = embedResponse.data.token;
    return { embedToken, reportId, groupId: config.groupId };

  } catch (error) {
    console.error('Error en el proceso de autenticación o solicitud de token:', error);
    throw error;
  }
};
