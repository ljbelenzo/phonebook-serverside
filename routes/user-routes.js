import express from 'express'
import { check } from 'express-validator';
import inputValidation from '../models/input-validation.js';

import checkAuth from '../middleware/check-auth.js';

import { fileUpload } from '../middleware/file-upload.js';

import {resetUserPassword, getUsersByEmail, login,getUserContacts, getUsers,createUser, updateUser, DeleteUser} from '../controllers/user-controller.js'

const router = express.Router();

router.post('/login',
    [
        check('email')
            .not()
            .isEmpty(), 
        check('password')
            .not()
            .isEmpty(),
    ],
    login);

router.get('/contact',
    checkAuth, 
    getUserContacts);

router.get('/',
    checkAuth, 
    getUsers);

router.get('/email/:email',
    getUsersByEmail);

router.post('/',
    checkAuth, 
    fileUpload.single('contactPhoto'),
    [
        check('email').normalizeEmail().isEmail(),
        check('firstName')
            .not()
            .isEmpty(), 
        check('lastName')
            .not()
            .isEmpty(),
        check('contactNumber')
            .not()
            .isEmpty(),
        check('password')
            .not()
            .isEmpty(),
    ],  
    inputValidation,
    createUser);

router.patch('/password/reset/:id',
    resetUserPassword);

router.patch('/:id',
    checkAuth, 
    fileUpload.single('contactPhoto'),
    inputValidation,
    updateUser);

router.delete('/:id',
    checkAuth, 
    DeleteUser);

export default router;