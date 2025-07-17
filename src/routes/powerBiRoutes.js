import express from 'express';
import { getRolesFromPowerBI } from '../services/rolePowerBiService.js';

const router = express.Router();
router.post('/roles/powerbi', async (req, res) => {
  const { groupId, datasetId } = req.body;
  try {
    const roles = await getRolesFromPowerBI(groupId, datasetId);
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
});
export default router;