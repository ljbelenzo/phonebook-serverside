import express from 'express'
import { check } from 'express-validator';
import inputValidation from '../models/input-validation.js';

import checkAuth from '../middleware/check-auth.js';

import { fileUpload } from '../middleware/file-upload.js';

import {unShareContact, shareContact, getContacts, createContact, updateContact, deleteContact} from '../controllers/contact-controller.js'

const router = express.Router();

router.get('/',
    checkAuth, 
    getContacts);

router.patch('/share/:cid/:userid',
    checkAuth, 
    shareContact);

router.patch('/unshare/:cid/:userid',
    checkAuth, 
    unShareContact);

router.post('/',
    checkAuth, 
    // fileUpload.single('contactPhoto'),
    [
        check('contactFirstName')
            .not()
            .isEmpty(), 
        check('contactLastName')
            .not()
            .isEmpty(), 
        check('contactEmail')
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
    // fileUpload.single('contactPhoto'),
    inputValidation,
    updateContact);

router.delete('/:id',
    checkAuth, 
    deleteContact);

export default router;