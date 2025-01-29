import HttpError from "../models/http-error.js";
import jwt from "jsonwebtoken";

const jwt_passcode = process.env?.JWT_PASS || "default_passcode_8462017935";

const checkAuth = (req,res,next) =>{
    const {authorization} = req?.headers;
    const token = authorization?.split(' ')[1] || undefined;  

    if(req?.method === 'OPTIONS') return next();

    if(!token) return next(new HttpError(`Authentication failed`, 401));

    try{
        const decodedToken = jwt.verify(token, jwt_passcode);

        const { userId, email } = decodedToken;
        req.userData = {
            userId,
            email
        };
        next();
    }catch(e){
        return next(new HttpError(`Bearer Token Expired`, 401));
    }
};

export default checkAuth;