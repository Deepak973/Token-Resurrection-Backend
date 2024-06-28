import express from 'express';
import User from '../models/User';

const router = express.Router();

//User api
router.get('/user', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  try {
    const user = await User.findOne({ address }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found for the specified address' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
export default router;

