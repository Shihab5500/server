
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import verifyAuth from './middleware/verifyAuth.js';
import Issue from './models/Issue.js'; 
import Contribution from './models/Contribution.js'; 

const app = express();
app.use(express.json());
app.use(cors({
  // .env থেকে CLIENT_ORIGIN নিবে, না পেলে 5173 ব্যবহার করবে 
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true,
}));

//  MongoDB কানেকশন 
const dbUri = process.env.DB_URI;
if (!dbUri) {
    console.error('🔥 MongoDB URI (DB_URI) is missing in .env file.');
} else {
    mongoose.connect(dbUri) 
        .then(() => console.log('✅ MongoDB connected successfully.'))
        .catch(err => console.error('🔥 MongoDB connection error:', err));
}

app.get('/', (_req, res) => {
  res.status(200).send('Clean City API ✅');
});


app.get('/issues', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // ফিল্টারিং এর জন্য
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;

    
    // যদি 'search' কোয়েরি আসে
    if (req.query.search) {
      filters.$or = [
        
        { title: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const items = await Issue.find(filters)
      .sort({ date: -1 }) // নতুন ডেটা আগে
      .skip(skip)
      .limit(limit);
      
    const total = await Issue.countDocuments(filters);
    
    res.status(200).json({ items, total });
  } catch (err) {
    console.error("🔥 Failed to fetch issues:", err.message);
    res.status(500).json({ message: "Failed to fetch issues", error: err.message });
  }
});


// GET /issues/recent (Home পেজের জন্য)
app.get('/issues/recent', async (req, res) => {
  try {
    const recent = await Issue.find({}).sort({ date: -1 }).limit(6);
    res.status(200).json(recent);
  } catch (err) {
    console.error("🔥 Failed to fetch recent issues:", err.message);
    res.status(500).json({ message: "Failed to fetch recent issues", error: err.message });
  }
});

// GET /my-issues (My Issues - শুধু নিজের ডেটা)
app.get('/my-issues', verifyAuth, async (req, res) => {
  try {
    const myIssues = await Issue.find({ email: req.user.email }).sort({ date: -1 });
    res.status(200).json(myIssues);
  } catch (err) {
    console.error("🔥 Failed to fetch my issues:", err.message);
    res.status(500).json({ message: "Failed to fetch my issues", error: err.message });
  }
});

// GET /issues/:id (Issue Details পেজের জন্য)
app.get('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.status(200).json(issue);
  } catch (err) {
    console.error("🔥 Failed to fetch issue details:", err.message);
    res.status(500).json({ message: "Failed to fetch issue details", error: err.message });
  }
});

// POST /issues (Add Issue পেজের জন্য)
app.post('/issues', verifyAuth, async (req, res) => {
  try {
    const email = req.user.email;
    const doc = { ...req.body, email: email, date: new Date() };
    const saved = await Issue.create(doc);
    res.status(201).json(saved);
  } catch (err) {
    console.error("🔥 Issue creation failed:", err.message);
    res.status(500).json({ message: "Failed to create issue", error: err.message });
  }
});

// PUT /issues/:id (My Issues পেজের Update বাটনের জন্য)
app.put('/issues/:id', verifyAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.email !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: You can only edit your own issues." });
    }
    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedIssue);
  } catch (err) {
    console.error("🔥 Failed to update issue:", err.message);
    res.status(500).json({ message: "Failed to update issue", error: err.message });
  }
});

// DELETE /issues/:id (My Issues পেজের Delete বাটনের জন্য)
app.delete('/issues/:id', verifyAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.email !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own issues." });
    }
    await Issue.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (err) {
    console.error("🔥 Failed to delete issue:", err.message);
    res.status(500).json({ message: "Failed to delete issue", error: err.message });
  }
});


// Contribution Routes

app.post('/contributions', verifyAuth, async (req, res) => {
  try {
    const payload = { ...req.body, email: req.user.email, userId: req.user.uid, date: new Date() };
    const saved = await Contribution.create(payload);
    res.status(201).json(saved);
  } catch (err) {
    console.error("🔥 Contribution failed:", err.message);
    res.status(500).json({ message: "Contribution failed", error: err.message });
  }
});

app.get('/contributions/:issueId', async (req, res) => {
  try {
    const rows = await Contribution.find({ issueId: req.params.issueId }).sort({ date: -1 });
    res.status(200).json(rows);
  } catch (err) {
    console.error("🔥 Failed to fetch contributions:", err.message);
    res.status(500).json({ message: "Failed to fetch contributions", error: err.message });
  }
});

app.get('/my-contributions', verifyAuth, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ message: "User not authenticated" });

    const rows = await Contribution.aggregate([
      { $match: { email: userEmail } },
      { $sort: { date: -1 } },
      {
        $addFields: {
          issueObjectId: { 
            $cond: {
               if: { $ne: ["$issueId", null] },
               then: { $toObjectId: "$issueId" },
               else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: 'issues',
          localField: 'issueObjectId',
          foreignField: '_id',
          as: 'issueDetails'
        }
      },
      {
        $unwind: {
          path: "$issueDetails",
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("🔥 Failed to fetch my contributions:", err.message);
    res.status(500).json({ message: "Failed to fetch my contributions", error: err.message });
  }
});


// গ) Stats Route (Home পেজের জন্য)

app.get('/stats', async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'ended' });
    const pending = await Issue.countDocuments({ status: 'ongoing' });
    
    res.status(200).json({
      users: 0, 
      totalIssues,
      resolved,
      pending
    });
  } catch (err) {
    console.error("🔥 Failed to get stats:", err.message);
    res.status(500).json({ message: "Failed to get stats", error: err.message });
  }
});


if (process.env.NODE_ENV !== 'production') {
  app.get('/_debug/whoami', verifyAuth, (req, res) => res.json(req.user));
}

app.listen(process.env.PORT || 5000, () =>
  console.log(`API running on :${process.env.PORT || 5000}`)
);