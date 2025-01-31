import mongoose from "mongoose";

const Schema = mongoose.Schema;

const contactSchema = new Schema({
    ownerId:{type:mongoose.Types.ObjectId, required:true, ref:'User'},
    contactFirstName:{type:String, required:true},
    contactLastName:{type:String, required:true},
    contactNumber:{type:String, required:true},
    contactEmail:{type:String, required:true},
    contactPhoto:{type:String, required:false},
});

export default mongoose.model('Contacts',contactSchema);