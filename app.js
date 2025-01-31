import express from 'express';
import bodyParser from 'body-parser';
import HttpError from './models/http-error.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import contactRoutes from './routes/contact-routes.js'
import userRoutes from './routes/user-routes.js'

const AllowOrigin = process.env?.ALLOW_ORIGIN || "*";
const user = process.env?.MONGODB_USER || undefined;
const password = process.env?.MONGODB_PASSWORD || undefined;
const collection = process.env?.MONGODB_COLLECTION || undefined;
const appName = process.env?.MONGODB_CLUSTER || undefined;
const url = `mongodb+srv://${user}:${password}@clustertraining.jmaf3.mongodb.net/${collection}?retryWrites=true&w=majority&appName=${appName}`;

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads','images')));

app.use((req,res,next)=>{
    // set headers to API access 
    res.setHeader('Access-Control-Allow-Origin',"https://phonebook-clientside-production.up.railway.app");
    res.setHeader('Access-Control-Allow-Headers',"Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE')
    next();
});


// API ROUTES ---
app.use('/user',userRoutes);  
app.use('/contact',contactRoutes);  


// middleware to handle unregistered routes
app.use((req,res,next)=>{
    console.log(req.url);
    const error = new HttpError('Route Invalid', 404);
    throw error;
});

// error handling
app.use((err,req,res,next)=>{

    // if there are failed validations, the saved image will rollback
    if(req?.file){
        fs.unlink(req.file.path, (err)=>{
            console.log('file unlink failed : ', err);
        });
    }

    if(res.headerSent){
        return next(err);
    }


    const logError = {
        message:  err?.message || "Unknonw Error",
        // headers: req?.headers,
        // body: req?.body
    };

    console.error("Error : ",logError);
    res.status(err?.code || 500).json(logError);
});

mongoose
    .connect(url)
    .then(()=>{
        console.info('mongoose connected... Endpoints are now Live');
        app.listen(5000);
    })
    .catch(err=>{
        console.error('mongoose disconnected... Call God: ',err);

        if(!user || !password || !collection || !appName){
            console.error("Missing .env file values: ",{
                user,
                password,
                collection,
                appName
            });
        }
    });