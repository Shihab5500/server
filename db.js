import mongoose from 'mongoose';
export const connectDB = async (uri) => {
  try { await mongoose.connect(uri, { dbName: 'clean_city' }); console.log('MongoDB connected'); }
  catch(e){ console.error('MongoDB connection error', e.message); process.exit(1); }
};
