import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import HttpError from '../models/http-error.js';
import User from '../models/user.js';
import bcrypt from "bcryptjs"
import Contacts from '../models/contacts.js';

import fs from "fs";

const jwt_passcode = process.env?.JWT_PASS || "default_passcode_8462017935";
const tokenDuration = process.env?.TOKEN_DURATION || "1hr";

const generateJWT = (user) => {
    const token = jwt.sign(
        {userId: user?.id, email:user.email },
        jwt_passcode,
        {expiresIn: tokenDuration}
    );

    return token;
}

export const getUserContacts = async (req,res,next) => {
    try{
        const { userId } = req?.userData || undefined;

        let userContacts = await Contacts.find({ownerId:userId});
        let {sharedContacts} = await User.findById(userId).populate("sharedContacts");

        sharedContacts = sharedContacts.map((contacts)=>({
            ...contacts.toObject({getters:true}),
            shared: true,
        }));

        userContacts = userContacts.map(contacts=>contacts.toObject({getters:true}))

        let data = [...userContacts,...sharedContacts];

        // data = data.sort((a, b) => a.contactName.localeCompare(b.contactName));

        res.json({
        count:{
            contacts:data.length,
            shared:sharedContacts.length
        }, 
        data});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const login = async (req,res,next) => {
    try{
        const { email, password} = req?.body || {};

        const existingUser = await User.findOne({email});
        const { password:userPassword, status } = existingUser || {};

        if(!existingUser){
            return next(new HttpError(`User not found`, 500));
        }

        if(status !== "active"){
            return next(new HttpError(`User is ${status === "deactivated" ? status : "is still pending approval"}`, 500));
        }

        const isValidPassword = await bcrypt.compare(password,userPassword);

        if(!isValidPassword){
            return next(new HttpError(`Invalid Password`, 500));
        }

        const token = generateJWT(existingUser);

        const {id, email:userEmail, role} = existingUser;

        res.status(201).json({data:{
            id,
            email:userEmail,
            token,
            role,
        }});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const getUsersByEmail = async (req,res,next) => {
    try{
        const userEmail = req.params?.email || undefined;

        let data = await User.findOne({email:userEmail},'-password');

        data = data? data.toObject({getters:true}) : data;

        // if(!data){
        //     return next(new HttpError(`Email not found'`, 500));
        // };

        if(data?.id && data.status !== "active"){
            return next(new HttpError(`Email ${data.status === "deactivated" ? "has been deactivated" : "is still pending approval"}`, 500));
        }

        res.json({data:data?.id});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const getUsers = async (req,res,next) => {
    try{
        let { where = "{}", sort = "[]" } = req.query;

        let { skip = 0, limit = 50 } = req.query;

        where = JSON.parse(where);
        sort = JSON.parse(sort);
        skip = parseInt(skip);
        limit = parseInt(limit);

        let data = await User
            .find(where,'-password')
            .skip(skip)
            .limit(limit)
            .sort(sort ? "createdAt DESC" : sort)
            .populate("sharedContacts");

        const count = await User.countDocuments(where);

        data = data.length > 0? data.map(user=>user.toObject({getters:true})) : {};

        res.json({count,data});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const createUser = async (req,res,next) => {
    try{
        const { firstName,lastName,contactNumber,email,password,role } = req?.body || {};
        const hashedPassword = await bcrypt.hash(password,12);

        const createUser = new User({
            contactPhoto: req?.file?.path || `https://picsum.photos/${Math.floor(Math.random() * 100) + 200}/${Math.floor(Math.random() * 100) + 200}`,
            firstName,
            lastName,
            contactNumber,
            password: hashedPassword,
            email,
            role,
        });

        await createUser.save();

        res.status(201).json({data:{
           message:"User has been created"
        }});

    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const updateUser = async (req,res,next) => {
    try{
        const body = req?.body || undefined;
        const userId = req.params?.id || undefined;

        const checkUser = await User.findById(userId);

        const { role } = checkUser || {};

        if(!checkUser){
            return next(new HttpError(`User to update not found'`, 500));
        };

        if(role === "deactivated"){
            return next(new HttpError(`User to update has been deactivated'`, 500));
        }

        Object.entries(body).map(([key, value]) => {
            checkUser[key] = value;
            }
        );

        checkUser.contactPhoto = req?.file?.path || checkUser.contactPhoto;

        await checkUser.save();

        res.status(201).json({data:{
            message:`User has been updated"`
        }});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const resetUserPassword = async (req,res,next) => {
    try{
        const { password } = req?.body || {};
        const userId = req.params?.id || undefined;

        const checkUser = await User.findById(userId);

        const { role } = checkUser || {};

        if(!checkUser){
            return next(new HttpError(`User to update not found'`, 500));
        };

        if(role === "deactivated"){
            return next(new HttpError(`User to update has been deactivated'`, 500));
        }

        checkUser.password = await bcrypt.hash(password,12);

        await checkUser.save();

        res.status(201).json({data:{
            message:`User password has been updated"`
        }});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};

export const DeleteUser = async (req,res,next) => {
    try{
        const userId = req.params?.id || undefined;

        const checkuser = await User.findById(userId);

        if(!checkuser){
            return next(new HttpError(`User to delete not found'`, 500));
        }

        const ImagePath = checkuser?.contactPhoto;

        const session = await mongoose.startSession();
        session.startTransaction();
        await checkuser.deleteOne({session});
        await session.commitTransaction();
        
        fs.unlink(ImagePath,err=>{
            console.log('file unlink failed : ', err);
        });

        res.status(201).json({message:"User has been deleted."});
    }catch(err){
        return next(new HttpError(`Error : ${err.message}`, 500));
    }
};