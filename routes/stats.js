


// import { Router } from 'express';
// import Issue from '../models/Issue.js';
// import Contribution from '../models/Contribution.js';
// import verifyAuth from '../middleware/verifyAuth.js'; // ✅ সঠিক পাথ

// const router = Router();

// // হোম পেজ স্ট্যাটস
// router.get('/', async (_req, res) => {
//   try {
//     const totalIssues = await Issue.countDocuments();
//     const resolved = await Issue.countDocuments({ status: 'ended' });
//     const ongoing = await Issue.countDocuments({ status: 'ongoing' });
//     const usersCount = (await Issue.distinct('email')).length; // সিম্পল ইউজার কাউন্ট

//     const result = await Contribution.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
//     const totalRaised = result[0]?.sum || 0;

//     res.json({ users: usersCount, totalIssues, resolved, ongoing, totalRaised });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ড্যাশবোর্ড স্ট্যাটস
// router.get('/dashboard', verifyAuth, async (req, res) => {
//   try {
//     const email = req.user.email;
//     const categoryData = await Issue.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
//     const statusData = await Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
//     const myIssuesCount = await Issue.countDocuments({ email });
//     const myContribs = await Contribution.countDocuments({ email });

//     res.json({ categoryData, statusData, userStats: { myIssuesCount, myContribs } });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;

import { Router } from 'express';
import Issue from '../models/Issue.js';
import Contribution from '../models/Contribution.js';
import verifyAuth from '../middleware/verifyAuth.js';

const router = Router();

// ১. পাবলিক স্ট্যাটাস (Home পেজের জন্য - সবার জন্য উন্মুক্ত)
router.get('/', async (_req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'ended' });
    const ongoing = await Issue.countDocuments({ status: 'ongoing' });
    
    // ইউনিক ইউজার সংখ্যা বের করা
    const uniqueEmails = await Issue.distinct('email');
    
    const result = await Contribution.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    const totalRaised = result[0]?.sum || 0;

    res.json({ users: uniqueEmails.length, totalIssues, resolved, ongoing, totalRaised });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ২. ড্যাশবোর্ড স্ট্যাটাস (রোল অনুযায়ী আলাদা ডাটা)
router.get('/dashboard', verifyAuth, async (req, res) => {
  try {
    const email = req.user.email;
    
    // সিম্পল এডমিন চেক: যদি ইমেইল demo@admin.com হয়, তবে সে এডমিন
    // (প্রোডাকশনে এটা ডাটাবেস থেকে চেক করা ভালো, তবে অ্যাসাইনমেন্টের জন্য এটা চলবে)
    const isAdmin = email === 'demo@admin.com'; 

    // যদি এডমিন হয়, তবে সব ডাটা দেখবে ({})
    // যদি ইউজার হয়, তবে শুধু তার ইমেইলের ডাটা দেখবে ({ email: email })
    const filter = isAdmin ? {} : { email: email };

    // চার্ট ১: ক্যাটাগরি অনুযায়ী
    const categoryData = await Issue.aggregate([
      { $match: filter }, // <-- এখানে ফিল্টার যোগ করা হয়েছে
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // চার্ট ২: স্ট্যাটাস অনুযায়ী
    const statusData = await Issue.aggregate([
      { $match: filter }, // <-- এখানে ফিল্টার যোগ করা হয়েছে
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // কার্ডের ডাটা (সবসময় নিজেরটাই দেখাবে, যাতে ইউজার কনফিউজ না হয়)
    const myIssuesCount = await Issue.countDocuments({ email });
    const myContribs = await Contribution.countDocuments({ email });

    res.json({ 
      categoryData, 
      statusData, 
      userStats: { myIssuesCount, myContribs },
      isAdmin // ফ্রন্টএন্ডে ওয়েলকাম মেসেজ চেঞ্জ করার জন্য পাঠাতে পারো
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;