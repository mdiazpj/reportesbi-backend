import axios from 'axios';
import { ConfidentialClientApplication } from '@azure/msal-node';
import config from '../config/config.js';

const cca = new ConfidentialClientApplication({
  auth: {
    clientId:   config.clientId,
    authority:  `https://login.microsoftonline.com/${config.tenantId}`,
    clientSecret: config.clientSecret
  }
});

export const getRolesFromPowerBI = async (groupId, datasetId) => {
  /* 1. Access-token del master-user o service principal */
  const { accessToken } = await cca.acquireTokenByUsernamePassword({
    scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    username: config.username,
    password: config.password
  });

  /* 2. Ejecutar las DMVs via executeQueries */
  const body = {
    queries: [
      { query: 'EVALUATE TMSCHEMA_ROLES' },
      { query: 'EVALUATE TMSCHEMA_ROLE_MEMBERSHIP' }
    ]
  };

  const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}` +
              `/datasets/${datasetId}/executeQueries`;

  const { data } = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  /* 3. Unir las dos tablas devueltas */
  const rolesRows    = data.results[0].tables[0].rows; // idRole, name…
  const membersRows  = data.results[1].tables[0].rows; // idRole, memberName

  if (!rolesRows.length) {
    return { 'Sin roles RLS': [] };
  }

  const map = {};
  rolesRows.forEach(r => {
    map[r.name] = membersRows
      .filter(m => m.roleId === r.roleId)
      .map(m => m.memberName);
  });

  return map;
};
