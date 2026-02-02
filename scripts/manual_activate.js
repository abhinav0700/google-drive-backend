
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Token from '../src/models/Token.js';

// Setup dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory (backend root)
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('DB Connection Error:', error);
        process.exit(1);
    }
};

const checkActivation = async () => {
    await connectDB();

    const targetToken = '2aeb025dfa869be88c98a16f037e79ab452c9303f1fffd9317ac863e83d2bb94';

    console.log(`\nChecking Token: ${targetToken.substring(0, 10)}...`);

    const tokenDoc = await Token.findOne({ token: targetToken });

    if (!tokenDoc) {
        console.log('❌ Token NOT FOUND in database.');
        console.log('Possible reasons:');
        console.log('1. Account already activated (token deleted).');
        console.log('2. Token expired (24h limit).');
        console.log('3. Token mismatch.');

        // List all users to see if any are inactive
        const inactiveUsers = await User.find({ status: 'inactive' });
        console.log(`\nFound ${inactiveUsers.length} inactive users.`);
        inactiveUsers.forEach(u => console.log(`- ${u.email}`));

    } else {
        console.log('✅ Token FOUND!');
        console.log('Associated User ID:', tokenDoc.userId);

        const user = await User.findById(tokenDoc.userId);
        if (user) {
            console.log(`User found: ${user.email}`);
            console.log(`Current Status: ${user.status}`);

            console.log('Attempting manual activation...');
            try {
                user.status = 'active';
                await user.save();
                console.log('✅ User status updated to ACTIVE.');

                await Token.findByIdAndDelete(tokenDoc._id);
                console.log('✅ Token deleted.');
            } catch (err) {
                console.error("FATAL SAVE ERROR:", err.message);
            }
        } else {
            console.log('❌ User associated with token NOT FOUND.');
        }
    }

    process.exit();
};

checkActivation();
