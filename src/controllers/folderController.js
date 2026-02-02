import Folder from '../models/Folder.js';

export const createFolder = async (req, res) => {
    try {
        const { name, parentFolder } = req.body;
        let path = '';

        if (parentFolder) {
            const parent = await Folder.findById(parentFolder);
            if (!parent) return res.status(404).json({ message: 'Parent folder not found' });

            if (parent.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }
            path = parent.path ? `${parent.path}/${parent._id}` : `/${parent._id}`;
        }

        const folder = await Folder.create({
            user: req.user._id,
            name,
            parentFolder: parentFolder || null,
            path
        });

        res.status(201).json(folder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFolders = async (req, res) => {
    try {
        const { parent } = req.query;
        const query = { user: req.user._id };

        // Explicitly check for 'undefined' or empty string if frontend sends nothing
        if (parent && parent !== 'null' && parent !== 'undefined') {
            query.parentFolder = parent;
        } else {
            query.parentFolder = null;
        }

        const folders = await Folder.find(query);
        res.json(folders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Folder.deleteOne({ _id: req.params.id });
        res.json({ message: 'Folder removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const renameFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        folder.name = req.body.name || folder.name;
        await folder.save();
        res.json(folder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
