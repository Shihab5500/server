import { Router } from 'express';
import Contribution from '../models/Contribution.js';
import verifyAuth from '../middleware/verifyAuth.js';

const router = Router();

// কন্ট্রিবিউশন করা
router.post('/', verifyAuth, async (req, res) => {
  try {
      const payload = { 
          ...req.body, 
          email: req.user.email, 
          userId: req.user.uid, 
          date: new Date() 
      };
      const saved = await Contribution.create(payload);
      res.status(201).json(saved);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// স্পেসিফিক ইস্যুর কন্ট্রিবিউশন লিস্ট
router.get('/:issueId', async (req, res) => {
  try {
      const rows = await Contribution.find({ issueId: req.params.issueId }).sort({ date: -1 });
      res.json(rows);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

export default router;