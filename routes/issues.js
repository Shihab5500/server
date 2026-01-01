// import { Router } from 'express';
// import Issue from '../models/Issue.js';
// import verifyAuth from '../middleware/verifyAuth.js'; // ✅ সঠিক পাথ

// const router = Router();

// // সব ইস্যু দেখা (ফিল্টার সহ)
// router.get('/', async (req, res) => {
//   try {
//       const { search = '', category, status, page = 1, limit = 12, sort = 'newest' } = req.query;
//       const q = {};
      
//       if (search) {
//         q.$or = [
//           { title: { $regex: search, $options: 'i' } },
//           { location: { $regex: search, $options: 'i' } }
//         ];
//       }
//       if (category) q.category = category;
//       if (status) q.status = status;

//       // সর্টিং লজিক
//       let sortOption = { date: -1 }; // Default Newest
//       if(sort === 'oldest') sortOption = { date: 1 };

//       const skip = (Number(page)-1) * Number(limit);
      
//       const [items, total] = await Promise.all([
//         Issue.find(q).sort(sortOption).skip(skip).limit(Number(limit)),
//         Issue.countDocuments(q)
//       ]);
      
//       res.json({ items, total });
//   } catch (err) {
//       res.status(500).json({ message: err.message });
//   }
// });

// // রিসেন্ট ইস্যু (হোম পেজ)
// router.get('/recent', async (_req, res) => {
//   const items = await Issue.find({}).sort({ date: -1 }).limit(6);
//   res.json(items);
// });

// // স্পেসিফিক ইস্যু ডিটেইলস
// router.get('/:id', async (req, res) => {
//   try {
//       const item = await Issue.findById(req.params.id);
//       if (!item) return res.status(404).json({ message: 'Issue not found' });
//       res.json(item);
//   } catch (err) {
//       res.status(500).json({ message: err.message });
//   }
// });

// // নতুন ইস্যু তৈরি
// router.post('/', verifyAuth, async (req, res) => {
//   try {
//       const { title, category, location, description, image, amount, status, name } = req.body;
//       const email = req.user.email;
      
//       const doc = await Issue.create({ 
//           title, category, location, description, image, amount, 
//           status: status || 'ongoing', 
//           email, 
//           name,
//           date: new Date() 
//       });
//       res.status(201).json(doc);
//   } catch (err) {
//       res.status(500).json({ message: err.message });
//   }
// });

// // আপডেট ইস্যু (শুধু নিজেরটা)
// router.put('/:id', verifyAuth, async (req, res) => {
//   try {
//       const item = await Issue.findById(req.params.id);
//       if (!item) return res.status(404).json({ message: 'Not found' });
//       if (item.email !== req.user.email) return res.status(403).json({ message: 'Forbidden' });
      
//       const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
//       res.json(updated);
//   } catch (err) {
//       res.status(500).json({ message: err.message });
//   }
// });

// // ডিলিট ইস্যু
// router.delete('/:id', verifyAuth, async (req, res) => {
//   try {
//       const item = await Issue.findById(req.params.id);
//       if (!item) return res.status(404).json({ message: 'Not found' });
//       if (item.email !== req.user.email) return res.status(403).json({ message: 'Forbidden' });
      
//       await item.deleteOne();
//       res.json({ success: true });
//   } catch (err) {
//       res.status(500).json({ message: err.message });
//   }
// });

// export default router;


import { Router } from 'express';
import Issue from '../models/Issue.js';
import verifyAuth from '../middleware/verifyAuth.js'; 

const router = Router();

// ১. সব ইস্যু দেখা (ফিল্টার সহ)
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

      // সর্টিং লজিক
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

// ২. রিসেন্ট ইস্যু
router.get('/recent', async (_req, res) => {
  const items = await Issue.find({}).sort({ date: -1 }).limit(6);
  res.json(items);
});

// ৩. স্পেসিফিক ইস্যু ডিটেইলস
router.get('/:id', async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Issue not found' });
      res.json(item);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// ৪. নতুন ইস্যু তৈরি
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

// ৫. আপডেট ইস্যু (Admin Power Added Here)
router.put('/:id', verifyAuth, async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      // লজিক: যদি নিজের পোস্ট না হয় এবং সে অ্যাডমিনও না হয়, তবেই এরর দিবে
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

// ৬. ডিলিট ইস্যু (Admin Power Added Here)
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
      const item = await Issue.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      // লজিক: অ্যাডমিন হলে যে কারো পোস্ট ডিলিট করতে পারবে
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