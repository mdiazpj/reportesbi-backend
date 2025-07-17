import { getRolesFromPowerBI } from '../services/rolesService.js';

export const getDatasetRoles = async (req, res) => {
  try {
    const { groupId, datasetId } = req.body;
    if (!groupId || !datasetId) {
      return res.status(400).json({ message: 'groupId y datasetId son requeridos' });
    }
    const roles = await getRolesFromPowerBI(groupId, datasetId);
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};