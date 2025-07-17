import axios from 'axios';
import { ConfidentialClientApplication } from '@azure/msal-node';
import config from '../config/config.js';

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: config.clientId,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
    clientSecret: config.clientSecret
  }
});

export const getRolesFromPowerBI = async (groupId, datasetId) => {
  const { accessToken } = await cca.acquireTokenByUsernamePassword({
    scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    username: config.username,
    password: config.password
  });

  // 1. ✅ INTENTAMOS OBTENER ROLES DIRECTAMENTE (API precisa)
  try {
    const { data: roles } = await axios.get(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/roles`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (roles?.length) {
      const directMap = {};
      roles.forEach(r => {
        directMap[r.name] = r.members?.map(m => m.emailAddress || m.identifier) || [];
      });
      console.log('✅ Roles obtenidos directamente con API de dataset.');
      return directMap;
    }
  } catch (err) {
    console.warn('⚠️ No se pudieron obtener los roles directamente:', err.message);
  }

  // 2. 🛠️ SI FALLA, USAMOS ESCANEO COMO BACKUP
  console.log('⏳ Usando método de escaneo como fallback...');

  const { data: { id: scanId } } = await axios.post(
    `https://api.powerbi.com/v1.0/myorg/admin/workspaces/getInfo?getArtifactUsers=true&datasetSchema=true`,
    { workspaces: [groupId] },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  let status = 'NotStarted';
  while (status !== 'Succeeded') {
    const { data } = await axios.get(
      `https://api.powerbi.com/v1.0/myorg/admin/workspaces/scanStatus/${scanId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    status = data.status;
    if (status === 'Failed') throw new Error('Scanner API falló');
    if (status !== 'Succeeded') await new Promise(r => setTimeout(r, 2000));
  }

  const { data: result } = await axios.get(
    `https://api.powerbi.com/v1.0/myorg/admin/workspaces/scanResult/${scanId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  console.dir(result, { depth: 6 });

  const ws = result.workspaces.find(w => w.id === groupId);
  if (!ws) throw new Error('Workspace no encontrado');

  const ds = ws.datasets.find(d => d.id === datasetId);
  if (!ds) throw new Error('Dataset no encontrado');

  const rolesMap = {};

  if (ds.roles?.length) {
    ds.roles.forEach(role => {
      rolesMap[role.name] = role.members.map(m => m.memberName);
    });
    console.log('✅ Roles obtenidos mediante escaneo.');
  } else {
    console.warn('⚠️ El dataset no tiene roles definidos (RLS). Usando usuarios con acceso.');
    if (ds.users?.length) {
      rolesMap["Acceso General"] = ds.users.map(u => u.emailAddress).filter(Boolean);
    } else {
      throw new Error("El dataset no tiene roles ni usuarios disponibles.");
    }
  }

  return rolesMap;
};
