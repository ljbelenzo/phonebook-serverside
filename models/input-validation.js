import HttpError from '../models/http-error.js';
import { validationResult } from 'express-validator';

export default (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        throw new HttpError(`${errors.array()[0].msg}:( ${errors.array()[0].value} ): ${errors.array()[0].path} on ${errors.array()[0].location}`,422);
    }
    next();
};