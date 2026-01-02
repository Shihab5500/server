

import { Router } from 'express';
import Issue from '../models/Issue.js';
import Contribution from '../models/Contribution.js';
import verifyAuth from '../middleware/verifyAuth.js';

const router = Router();


router.get('/', async (_req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'ended' });
    const ongoing = await Issue.countDocuments({ status: 'ongoing' });
    
    
    const uniqueEmails = await Issue.distinct('email');
    
    const result = await Contribution.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    const totalRaised = result[0]?.sum || 0;

    res.json({ users: uniqueEmails.length, totalIssues, resolved, ongoing, totalRaised });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/dashboard', verifyAuth, async (req, res) => {
  try {
    const email = req.user.email;
    
    
    const isAdmin = email === 'demo@admin.com'; 

    
    const filter = isAdmin ? {} : { email: email };

    
    const categoryData = await Issue.aggregate([
      { $match: filter }, 
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    
    const statusData = await Issue.aggregate([
      { $match: filter }, 
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    
    const myIssuesCount = await Issue.countDocuments({ email });
    const myContribs = await Contribution.countDocuments({ email });

    res.json({ 
      categoryData, 
      statusData, 
      userStats: { myIssuesCount, myContribs },
      isAdmin 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;