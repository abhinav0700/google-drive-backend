import express from 'express';
import {
    uploadFileSuccess,
    getFiles,
    deleteFile,
    renameFile,
    downloadFile,
    getDownloadUrl
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
    .get(protect, getFiles);

router.post('/upload', protect, upload.single('file'), uploadFileSuccess);

router.route('/:id')
    .delete(protect, deleteFile)
    .patch(protect, renameFile);

router.get('/:id/download', protect, downloadFile);
router.get('/:id/download-url', protect, getDownloadUrl);

export default router;
