// config/config.js
import dotenv from 'dotenv';

dotenv.config();

const config = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.USERNAMED,
  password: process.env.PASSWORD,
  scope: process.env.SCOPE,
  tenantId: process.env.TENANT_ID,
  groupId: process.env.GROUP_ID,
  tokenUrl: `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
  port: process.env.PORT || 3000,
};

export default config;
