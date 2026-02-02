import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    s3Key: { type: String, required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);
export default File;
