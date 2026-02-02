import express from 'express';
import {
    createFolder,
    getFolders,
    deleteFolder,
    renameFolder
} from '../controllers/folderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createFolder)
    .get(protect, getFolders);

router.route('/:id')
    .delete(protect, deleteFolder)
    .patch(protect, renameFolder);

export default router;
