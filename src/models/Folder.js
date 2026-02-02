import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    path: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
