import mongoose from 'mongoose';
const IssueSchema = new mongoose.Schema({
  title: {type:String, required:true},
  category: {type:String, enum:['Garbage','Illegal Construction','Broken Public Property','Road Damage'], required:true},
  location: {type:String, required:true},
  description: {type:String, required:true},
  image: {type:String, required:true},
  amount: {type:Number, required:true},
  status: {type:String, enum:['ongoing','ended'], default:'ongoing'},
  email: {type:String, required:true},
  date: {type: Date, default: Date.now}
},{timestamps:true});
export default mongoose.model('Issue', IssueSchema);
