import { Router } from 'express';
import Issue from '../models/Issue.js';
import Contribution from '../models/Contribution.js';
const router = Router();

router.get('/', async (_req, res) => {
  const [usersApprox, totalIssues, resolved, pending, totalRaised] = await Promise.all([
    (async () => {
      const issueUsers = await Issue.distinct('email');
      const contribUsers = await Contribution.distinct('email');
      return new Set([...issueUsers, ...contribUsers]).size;
    })(),
    Issue.countDocuments({}),
    Issue.countDocuments({ status: 'ended' }),
    Issue.countDocuments({ status: 'ongoing' }),
    Contribution.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]).then(r => (r[0]?.sum || 0))
  ]);
  res.json({ users: usersApprox, totalIssues, resolved, pending, totalRaised });
});

export default router;
