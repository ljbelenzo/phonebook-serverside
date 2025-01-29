import express from 'express'
import { check } from 'express-validator';
import inputValidation from '../models/input-validation.js';

import checkAuth from '../middleware/check-auth.js';

import { fileUpload } from '../middleware/file-upload.js';

import {shareContact, getContacts, createContact, updateContact, deleteContact} from '../controllers/contact-controller.js'

const router = express.Router();

router.get('/',
    checkAuth, 
    getContacts);

router.post('/share/:cid/:userid',
    checkAuth, 
    shareContact);

router.post('/',
    checkAuth, 
    fileUpload.single('contactPhoto'),
    [
        check('ownerId')
            .not()
            .isEmpty(), 
        check('contactNumber')
            .not()
            .isEmpty(), 
        check('contactNumber')
            .not()
            .isEmpty(),
    ],
    inputValidation,
    createContact);

router.patch('/:id',
    checkAuth, 
    fileUpload.single('contactPhoto'),
    inputValidation,
    updateContact);

router.delete('/:id',
    checkAuth, 
    deleteContact);

export default router;