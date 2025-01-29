import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    contactNumber:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    contactPhoto:{type:String, required:false},
    role:{type:String, enum:["super-admin", "admin", "user"],default:"user", required:true, },
    status:{type:String, enum:["active", "pending-approval", "deactivated"], default:"pending-approval", required:true,},
    sharedContacts:[{type:mongoose.Types.ObjectId, required:true, ref:'Contacts'}],
});

userSchema.plugin(mongooseUniqueValidator);

export default mongoose.model('User',userSchema);