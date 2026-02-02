import File from '../models/File.js';
import s3 from '../config/s3.js';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const uploadFileSuccess = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const file = await File.create({
            user: req.user._id,
            name: req.file.originalname,
            s3Key: req.file.key,
            folder: req.body.folderId || null,
            size: req.file.size,
            mimeType: req.file.mimetype
        });
        res.status(201).json(file);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFiles = async (req, res) => {
    try {
        const { folder } = req.query;
        const query = { user: req.user._id };
        if (folder && folder !== 'null' && folder !== 'undefined') {
            query.folder = folder;
        } else {
            query.folder = null;
        }
        const files = await File.find(query);
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (file.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key
        });
        await s3.send(command);

        await File.deleteOne({ _id: req.params.id });
        res.json({ message: 'File removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDownloadUrl = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (file.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (file.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key
        });

        try {
            const response = await s3.send(command);

            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

            response.Body.pipe(res);
        } catch (s3Error) {
            console.error("S3 Error:", s3Error);
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const renameFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (file.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

        file.name = req.body.name || file.name;
        await file.save();
        res.json(file);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
