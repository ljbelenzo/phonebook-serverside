import mongoose from 'mongoose';
import HttpError from '../models/http-error.js';
import Contacts from '../models/contacts.js';
import User from '../models/user.js';
import fs from "fs";

export const getContacts = async (req,res,next) => {
    try{
        let { where = "{}", sort = "[]", search } = req.query;

        let { skip = 0, limit = 50 } = req.query;

        where = JSON.parse(where);
        sort = JSON.parse(sort);
        skip = parseInt(skip);
        limit = parseInt(limit);

        let data = await Contacts
            .find(where)
            .skip(skip)
            .limit(limit)
            .sort(sort ? "createdAt DESC" : sort);

        const count = await Contacts.countDocuments(where);
            
        res.json({count, data:data.map(user=>user.toObject({getters:true}))});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const shareContact = async (req,res,next) => {
    try{
        const contactId = req.params?.cid || undefined;
        const userId = req.params?.userid || undefined;

        let checkContact = await Contacts.findById(contactId);
        const checkUser = await User.findById(userId);

        if(!checkContact){
            return next(new HttpError(`Contact not found'`, 500));
        };

        if(!checkUser){
            return next(new HttpError(`User not found'`, 500));
        };

        if(checkUser.status !== "active"){
            return next(new HttpError(`User is ${checkUser.status === "deactivated" ? checkUser.status : "is still pending approval"}`, 500));
        }

        const { firstName, lastName, sharedContacts } = checkUser;

        // check if already been shared to the user
        const checkExists = sharedContacts.includes(contactId);

        if(checkExists){
            return next(new HttpError(`This contact has been already shared to ${firstName} ${lastName}'`, 500));
        };

        const session = await mongoose.startSession();
        session.startTransaction();
        await checkContact.save({session})
        checkUser.sharedContacts.push(checkContact);
        await checkUser.save({session});
        await session.commitTransaction();

        res.status(201).json({message:`Contact has been shared with ${firstName} ${lastName}.`});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const createContact = async (req,res,next) => {
    try{
        const { ownerId,contactName,contactNumber,email } = req?.body || {};

        const checkUser = await User.findById(ownerId);

        if(!checkUser){
            return next(new HttpError(`User not found'`, 500));
        };

        if(checkUser.status !== "active"){
            return next(new HttpError(`User is ${checkUser.status === "deactivated" ? checkUser.status : "is still pending approval"}`, 500));
        }

        // check duplicate number
        const checkContact = await Contacts.find({ownerId, contactNumber, contactName });
        if(checkContact.length){
            return next(new HttpError(`Contact Number:${checkContact[0].contactNumber} with Name '${checkContact[0].contactName}' is already existed on your phoneboks`, 500));
        };

        const createContacts = new Contacts({
            ownerId,
            contactName,
            contactNumber,
            email,
            contactPhoto: req?.file?.path || `https://picsum.photos/${Math.floor(Math.random() * 400)}/${Math.floor(Math.random() * 400)}`,
        });

        await createContacts.save();
        
        res.status(201).json({data:{
            message:`Contact ${contactName} : ${contactNumber} has been created`
         }});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const updateContact = async (req,res,next) => {
    try{
        const body = req?.body || undefined;
        const contactId = req.params?.id || undefined;

        const checkContact = await Contacts.findById(contactId);

        if(!checkContact){
            return next(new HttpError(`Contact to update not found'`, 500));
        }

        Object.entries(body).map(([key, value]) => {
            checkContact[key] = value;
            }
        );

        checkContact.contactPhoto = req?.file?.path || checkContact.contactPhoto;

        await checkContact.save();

        res.status(201).json({data:{
            message:`Contact has been updated"`
        }});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const deleteContact = async (req,res,next) => {
    try{
        const contactId = req.params?.id || undefined;
        const checkContact = await Contacts.findById(contactId).populate("ownerId");

        if(!checkContact){
            return next(new HttpError(`Contact to delete not found'`, 500));
        }

        const ImagePath = checkContact?.contactPhoto;

        const session = await mongoose.startSession();
        session.startTransaction();
        await checkContact.deleteOne({session});
        checkContact.ownerId.sharedContacts.pull(checkContact);
        await checkContact.ownerId.save({session});
        await session.commitTransaction();

        fs.unlink(ImagePath,err=>{
                    console.log('file unlink failed : ', err);
        });

        res.status(201).json({message:"Contact has been deleted."});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};