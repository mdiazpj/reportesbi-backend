// src/config/msalConfig.js
import { ConfidentialClientApplication } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,   // Tu ID de cliente (Application ID)
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,  // ID del tenant
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,  // El secreto del cliente
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

export default cca;
