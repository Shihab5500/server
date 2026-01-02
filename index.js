// import 'dotenv/config';
// import cors from 'cors';
// import express from 'express';
// import mongoose from 'mongoose';

// // Routes Import
// import issueRoutes from './routes/issues.js';
// import contributionRoutes from './routes/contributions.js';
// import statsRoutes from './routes/stats.js';
// import Issue from './models/Issue.js';
// import Contribution from './models/Contribution.js';
// import verifyAuth from './middleware/verifyAuth.js';

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: [
//     'http://localhost:5173',                      
//     'https://clean-city-world.netlify.app',          
//     'https://server-five-brown-34.vercel.app'        
//   ],
//   credentials: true,
// }));

// // DB Connection
// mongoose.connect(process.env.DB_URI)
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch(err => console.error('🔥 DB Error:', err));

// // Routes
// app.get('/', (_, res) => res.send('Clean City Server is Running...'));
// app.use('/issues', issueRoutes);
// app.use('/contributions', contributionRoutes);
// app.use('/stats', statsRoutes);

// // My Issues Route
// app.get('/my-issues', verifyAuth, async (req, res) => {
//     try {
//         const items = await Issue.find({ email: req.user.email }).sort({ date: -1 });
//         res.json(items);
//     } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // My Contributions Route
// app.get('/my-contributions', verifyAuth, async (req, res) => {
//     try {
//         const rows = await Contribution.aggregate([
//             { $match: { email: req.user.email } },
//             { $sort: { date: -1 } },
//             { $addFields: { issueObjectId: { $toObjectId: "$issueId" } } },
//             { $lookup: { from: 'issues', localField: 'issueObjectId', foreignField: '_id', as: 'issueDetails' } },
//             { $unwind: { path: "$issueDetails", preserveNullAndEmptyArrays: true } }
//         ]);
//         res.json(rows);
//     } catch (err) { res.status(500).json({ message: err.message }); }
// });


// if (process.env.NODE_ENV !== 'production') {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// export default app;


import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

// Routes Import
import issueRoutes from "./routes/issues.js";
import contributionRoutes from "./routes/contributions.js";
import statsRoutes from "./routes/stats.js";
import Issue from "./models/Issue.js";
import Contribution from "./models/Contribution.js";
import verifyAuth from "./middleware/verifyAuth.js";

const app = express();

/* -------------------- Middleware -------------------- */
app.use(express.json());

/**
 * ✅ CORS allowlist
 * - Local dev: http://localhost:5173
 * - Netlify (পুরোনো): clean-city-world.netlify.app (চাইলে রাখো)
 * - Vercel frontend: এখানে তোমার frontend vercel domain বসাবে
 *
 * Best: FRONTEND_URL env হিসেবে Vercel এ সেট করো
 * Example: FRONTEND_URL=https://client-xyz.vercel.app
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://clean-city-world.vercel.app",
  process.env.FRONTEND_URL, // ✅ set this in Vercel (recommended)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Postman / server-to-server calls: origin null হতে পারে
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

/* -------------------- DB Connection (serverless friendly) -------------------- */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.DB_URI) {
    throw new Error("DB_URI is missing in environment variables");
  }

  await mongoose.connect(process.env.DB_URI);
  isConnected = true;
  console.log("✅ MongoDB Connected");
}

// Connect on first request (Vercel serverless এ safe)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("🔥 DB Error:", err);
    next(err);
  }
});

/* -------------------- Routes -------------------- */
app.get("/", (_req, res) => res.send("Clean City Server is Running..."));

app.use("/issues", issueRoutes);
app.use("/contributions", contributionRoutes);
app.use("/stats", statsRoutes);

// My Issues Route (Protected)
app.get("/my-issues", verifyAuth, async (req, res) => {
  try {
    const items = await Issue.find({ email: req.user.email }).sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// My Contributions Route (Protected)
app.get("/my-contributions", verifyAuth, async (req, res) => {
  try {
    const rows = await Contribution.aggregate([
      { $match: { email: req.user.email } },
      { $sort: { date: -1 } },
      { $addFields: { issueObjectId: { $toObjectId: "$issueId" } } },
      {
        $lookup: {
          from: "issues",
          localField: "issueObjectId",
          foreignField: "_id",
          as: "issueDetails",
        },
      },
      { $unwind: { path: "$issueDetails", preserveNullAndEmptyArrays: true } },
    ]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------- Error Handler -------------------- */
app.use((err, _req, res, _next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: err.message || "Server error" });
});

/* -------------------- Local dev only: app.listen -------------------- */
/**
 * Vercel এ app.listen লাগে না (serverless function handle করে)
 * Local এ চালাতে চাইলে:
 *   node index.js
 */
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

export default app;
