import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

// Routes Import
import issueRoutes from './routes/issues.js';
import contributionRoutes from './routes/contributions.js';
import statsRoutes from './routes/stats.js';
import Issue from './models/Issue.js';
import Contribution from './models/Contribution.js';
import verifyAuth from './middleware/verifyAuth.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',                         // লোকাল ডেভেলপমেন্ট
    'https://clean-city-world.netlify.app',          // ✅ আপনার লাইভ ফ্রন্টএন্ড (Netlify)
    'https://server-five-brown-34.vercel.app'        // ব্যাকএন্ড ডোমেইন (Optional)
  ],
  credentials: true,
}));

// DB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('🔥 DB Error:', err));

// Routes
app.get('/', (_, res) => res.send('Clean City Server is Running...'));
app.use('/issues', issueRoutes);
app.use('/contributions', contributionRoutes);
app.use('/stats', statsRoutes);

// My Issues Route
app.get('/my-issues', verifyAuth, async (req, res) => {
    try {
        const items = await Issue.find({ email: req.user.email }).sort({ date: -1 });
        res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// My Contributions Route
app.get('/my-contributions', verifyAuth, async (req, res) => {
    try {
        const rows = await Contribution.aggregate([
            { $match: { email: req.user.email } },
            { $sort: { date: -1 } },
            { $addFields: { issueObjectId: { $toObjectId: "$issueId" } } },
            { $lookup: { from: 'issues', localField: 'issueObjectId', foreignField: '_id', as: 'issueDetails' } },
            { $unwind: { path: "$issueDetails", preserveNullAndEmptyArrays: true } }
        ]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Vercel Export
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;