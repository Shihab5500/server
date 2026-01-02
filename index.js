


import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import issueRoutes from "./routes/issues.js";
import contributionRoutes from "./routes/contributions.js";
import statsRoutes from "./routes/stats.js";
import Issue from "./models/Issue.js";
import Contribution from "./models/Contribution.js";
import verifyAuth from "./middleware/verifyAuth.js";

const app = express();


app.use(express.json());


const allowedOrigins = [
  "http://localhost:5173",
  "https://clean-city-world.vercel.app",
  process.env.FRONTEND_URL, 
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);


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


app.use((err, _req, res, _next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: err.message || "Server error" });
});


const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

export default app;
