


import { Router } from 'express';
import Issue from '../models/Issue.js';
import verifyAuth from '../middleware/verifyAuth.js'; 

const router = Router();


router.get('/', async (req, res) => {
  try {
      const { search = '', category, status, page = 1, limit = 12, sort = 'newest' } = req.query;
      const q = {};
      
      if (search) {
        q.$or = [
          { title: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) q.category = category;
      if (status) q.status = status;

     
      let sortOption = { date: -1 }; 
      if(sort === 'oldest') sortOption = { date: 1 };

      const skip = (Number(page)-1) * Number(limit);
      
      const [items, total] = await Promise.all([
        Issue.find(q).sort(sortOption).skip(skip).limit(Number(limit)),
        Issue.countDocuments(q)
      ]);
      
      res.json({ items, total });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


router.get('/recent', async (_req, res) => {
  const items = await Issue.find({}).sort({ date: -1 }).limit(6);
  res.json(items);
});


router.get('/:id', async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Issue not found' });
      res.json(item);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


router.post('/', verifyAuth, async (req, res) => {
  try {
      const { title, category, location, description, image, amount, status, name } = req.body;
      const email = req.user.email;
      
      const doc = await Issue.create({ 
          title, category, location, description, image, amount, 
          status: status || 'ongoing', 
          email, 
          name,
          date: new Date() 
      });
      res.status(201).json(doc);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


router.put('/:id', verifyAuth, async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      //  যদি নিজের পোস্ট না হয় এবং সে অ্যাডমিনও না হয়, তবেই এরর দিবে
      const isAdmin = req.user.email === 'demo@admin.com';
      if (item.email !== req.user.email && !isAdmin) {
          return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


router.delete('/:id', verifyAuth, async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      //  অ্যাডমিন হলে যে কারো পোস্ট ডিলিট করতে পারবে
      const isAdmin = req.user.email === 'demo@admin.com';
      if (item.email !== req.user.email && !isAdmin) {
          return res.status(403).json({ message: 'Forbidden' });
      }
      
      await item.deleteOne();
      res.json({ success: true });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

export default router;