import { Router } from 'express';
import Contribution from '../models/Contribution.js';
import { verifyAuth } from '../firebaseAdmin.js';
const router = Router();

router.post('/', verifyAuth, async (req, res) => {
  const { issueId, amount, name, phone, address, additionalInfo } = req.body;
  const email = req.user?.email;
  const doc = await Contribution.create({ issueId, amount, name, email, phone, address, additionalInfo, date: new Date() });
  res.status(201).json(doc);
});

router.get('/by-issue/:id', async (req, res) => {
  const rows = await Contribution.find({ issueId: req.params.id }).sort({ createdAt: -1 });
  res.json(rows);
});

router.get('/mine', verifyAuth, async (req, res) => {
  const email = req.user?.email;
  const rows = await Contribution.find({ email }).sort({ createdAt: -1 });
  res.json(rows);
});

export default router;
