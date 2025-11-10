

import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  issueId: { type: String, required: true },
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true }, // যিনি কন্ট্রিবিউট করছেন তার ইমেইল (লগইন থেকে)
  phone: { type: String },
  address: { type: String },
  additionalInfo: { type: String },
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true } // লগইন করা ইউজারের Firebase UID
},{timestamps:true});

export default mongoose.model('Contribution', contributionSchema);