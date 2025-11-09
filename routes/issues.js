import { Router } from 'express';
import Issue from '../models/Issue.js';
import { verifyAuth } from '../firebaseAdmin.js';
const router = Router();

router.get('/', async (req, res) => {
  const { search = '', category, status, page = 1, limit = 12 } = req.query;
  const q = {};
  if (search) q.$or = [
    { title: { $regex: search, $options: 'i' } },
    { location: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
  if (category) q.category = category;
  if (status) q.status = status;
  const skip = (Number(page)-1) * Number(limit);
  const [items, total] = await Promise.all([
    Issue.find(q).sort({createdAt:-1}).skip(skip).limit(Number(limit)),
    Issue.countDocuments(q)
  ]);
  res.json({ items, total });
});

router.get('/recent', async (_req, res) => {
  const items = await Issue.find({}).sort({ createdAt: -1 }).limit(6);
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const item = await Issue.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Issue not found' });
  res.json(item);
});

router.post('/', verifyAuth, async (req, res) => {
  const { title, category, location, description, image, amount, status } = req.body;
  const email = req.user?.email;
  const doc = await Issue.create({ title, category, location, description, image, amount, status: status || 'ongoing', email, date: new Date() });
  res.status(201).json(doc);
});

router.get('/mine/list', verifyAuth, async (req, res) => {
  const email = req.user?.email;
  const items = await Issue.find({ email }).sort({ createdAt: -1 });
  res.json(items);
});

router.put('/:id', verifyAuth, async (req, res) => {
  const email = req.user?.email;
  const item = await Issue.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Issue not found' });
  if (item.email !== email) return res.status(403).json({ message: 'Forbidden' });
  const allowed = ['title','category','location','description','image','amount','status'];
  for (const k of allowed) if (k in req.body) item[k] = req.body[k];
  await item.save();
  res.json(item);
});

router.delete('/:id', verifyAuth, async (req, res) => {
  const email = req.user?.email;
  const item = await Issue.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Issue not found' });
  if (item.email !== email) return res.status(403).json({ message: 'Forbidden' });
  await item.deleteOne();
  res.json({ success: true });
});

export default router;
