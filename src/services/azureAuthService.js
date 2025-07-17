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

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${config.tenantId}/reports/${reportId}/GenerateToken`;

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

//Metodo para generar un embedToken de multiples reportes (requiere datasetID)

const getDatasetIdFromReport = async (reportId, groupId, accessToken) => {
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });

  const datasetId = response.data.datasetId;
  if (!datasetId) {
    throw new Error(`datasetId no encontrado para el reporte ${reportId}`);
  }
  return datasetId;
};


export const getEmbedTokenMulti = async (reportList = []) => {
  try {
    // 1. Autenticación
    const result = await cca.acquireTokenByUsernamePassword({
      scopes: [config.scope],
      username: config.username,
      password: config.password,
    });

    const accessToken = result.accessToken;
    if (!accessToken) throw new Error('Access token no obtenido');

    // 2. Construir listas de reports y datasets
    const reports = [];
    const datasets = [];

    for (const { reportId, groupId } of reportList) {
      const datasetId = await getDatasetIdFromReport(reportId, groupId, accessToken);

      reports.push({ id: reportId, groupId });
      datasets.push({ id: datasetId, groupId });
    }

    // 3. Llamar a GenerateToken
    const url = 'https://api.powerbi.com/v1.0/myorg/GenerateToken';
    const payload = {
      reports,
      datasets,
      accessLevel: 'View',
    };

    const embedResponse = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      embedToken: embedResponse.data.token,
      expires: embedResponse.data.expiration,
      reports,
      datasets
    };

  } catch (error) {
    console.error('❌ Error en getEmbedTokenForReportsAuto:', error.response?.data || error.message);
    throw error;
  }
};



export const getEmbedTokenMultiRol = async (reportList = [], userInfo = {}) => {
  try {
    const { username, roles } = userInfo;

    // 1. Autenticación
    const result = await cca.acquireTokenByUsernamePassword({
      scopes: [config.scope],
      username: config.username,
      password: config.password,
    });

    const accessToken = result.accessToken;
    if (!accessToken) throw new Error('Access token no obtenido');

    // 2. Construir listas de reports y datasets (sin duplicados)
    const reports = [];
    const datasetsSet = new Set();
    let datasetIdBackoffice = null;

    for (const { reportId, groupId } of reportList) {
      const datasetId = await getDatasetIdFromReport(reportId, groupId, accessToken);
      reports.push({ id: reportId, groupId });
      datasetsSet.add(JSON.stringify({ id: datasetId, groupId }));

      // Guardar el datasetId solo para el reporte específico
      if (reportId.trim() === '25979569-68a3-410a-9200-c6d9b9b7c0be') {
        datasetIdBackoffice = datasetId;
      }
    }

    const datasets = Array.from(datasetsSet).map(item => JSON.parse(item));

    // Solo agregar identities si hay roles definidos, datasets y el datasetIdBackoffice existe
    const identities = [];
    if (
      username &&
      Array.isArray(roles) &&
      roles.length > 0 &&
      datasetIdBackoffice
    ) {
      identities.push({
        username,
        roles,
        datasets: [datasetIdBackoffice]
      });
    }

    console.log('Final reports, datasets, identities:', reports, datasets, identities);

    // 3. Llamar a GenerateToken, agregando identities solo si existen
    const url = 'https://api.powerbi.com/v1.0/myorg/GenerateToken';
    const payload = {
      reports,
      datasets,
      accessLevel: 'View',
      ...(identities.length > 0 && { identities })
    };

    const embedResponse = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      embedToken: embedResponse.data.token,
      expires: embedResponse.data.expiration,
      reports,
      datasets
    };

  } catch (error) {
    console.error('❌ Error en getEmbedTokenMultiRol:', error.response?.data || error.message);
    throw error;
  }
}



