

import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  issueId: { type: String, required: true },
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true }, 
  phone: { type: String },
  address: { type: String },
  additionalInfo: { type: String },
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true } 
},{timestamps:true});

export default mongoose.model('Contribution', contributionSchema);