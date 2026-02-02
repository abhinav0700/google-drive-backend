import User from '../models/User.js';
import Token from '../models/Token.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const message = {
        from: `"Cloud Canvas" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('✅ Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
};

export const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            status: 'inactive' // Inactive until activated
        });

        // Generate Activation Token
        const activationToken = crypto.randomBytes(32).toString('hex');
        await Token.create({
            userId: user._id,
            token: activationToken,
            type: 'activation'
        });

        // Send Email (non-blocking)
        const activationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${activationToken}`;
        const message = `Please click the following link to activate your account: ${activationUrl}`;

        console.log(`📧 Attempting to send activation email to: ${user.email}`);

        // Send email asynchronously without blocking the response
        sendEmail({
            email: user.email,
            subject: 'Account Activation - Cloud Canvas',
            message: message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">Welcome to Cloud Canvas!</h2>
                    <p>Thank you for registering. Please click the button below to activate your account:</p>
                    <a href="${activationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Activate Account</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${activationUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
                </div>
            `
        }).then(() => {
            console.log('✅ Activation email sent successfully to:', user.email);
        }).catch(emailError => {
            console.error('❌ Email sending failed for:', user.email);
            console.error('Error details:', emailError.message);
            console.log('\n--- DEV MODE: Activation Link ---');
            console.log(`User: ${user.email}`);
            console.log(`Link: ${activationUrl}`);
            console.log('---------------------------------\n');
        });

        // Respond immediately without waiting for email
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to activate your account.'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const activateAccount = async (req, res) => {
    try {
        const { token } = req.params;
        const tokenDoc = await Token.findOne({ token, type: 'activation' });

        if (!tokenDoc) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = await User.findById(tokenDoc.userId);
        if (!user) {
            console.log('Activation failed: User not found for token');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`Activating user: ${user.email} (Current status: ${user.status})`);
        user.status = 'active';
        await user.save();
        console.log(`User ${user.email} activated successfully.`);

        await Token.findByIdAndDelete(tokenDoc._id);

        const authToken = generateToken(user._id);

        res.json({
            success: true,
            message: 'Account activated',
            token: authToken,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.status !== 'active') {
                return res.status(401).json({ message: 'Account is not active. Please check your email.' });
            }

            res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    status: user.status,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        await Token.create({
            userId: user._id,
            token: resetToken,
            type: 'reset'
        });

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        console.log(`📧 Attempting to send password reset email to: ${user.email}`);

        // Send email asynchronously without blocking the response
        sendEmail({
            email: user.email,
            subject: 'Password Reset - Cloud Canvas',
            message: `You requested a password reset. Click here: ${resetUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">Password Reset Request</h2>
                    <p>You requested a password reset for your Cloud Canvas account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        }).then(() => {
            console.log('✅ Password reset email sent successfully to:', user.email);
        }).catch(emailError => {
            console.error('❌ Password reset email failed for:', user.email);
            console.error('Error details:', emailError.message);
            console.log('\n--- DEV MODE: Reset Link ---');
            console.log(`User: ${user.email}`);
            console.log(`Link: ${resetUrl}`);
            console.log('----------------------------\n');
        });

        // Respond immediately
        res.json({ success: true, message: 'Password reset email sent. Please check your inbox.' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const tokenDoc = await Token.findOne({ token, type: 'reset' });
        if (!tokenDoc) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = await User.findById(tokenDoc.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = password; // Pre-save hook will hash it
        await user.save();
        await Token.findByIdAndDelete(tokenDoc._id);

        res.json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
