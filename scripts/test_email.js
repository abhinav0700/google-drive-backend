import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
    console.log('🧪 Testing email configuration...\n');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
    console.log('');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('📧 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified!\n');

        console.log('📨 Sending test email...');
        const info = await transporter.sendMail({
            from: `"Cloud Canvas Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'Test Email - Cloud Canvas',
            html: `
                <h2>Email Configuration Test</h2>
                <p>If you're reading this, your email configuration is working correctly!</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
            `
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n✨ Email configuration is working perfectly!');
    } catch (error) {
        console.error('\n❌ Email test failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n🔑 Authentication failed. Please check:');
            console.error('1. EMAIL_USER is correct');
            console.error('2. EMAIL_PASS is a valid Gmail App Password (not your regular password)');
            console.error('3. 2-Step Verification is enabled on your Google account');
            console.error('\nHow to create App Password:');
            console.error('1. Go to: https://myaccount.google.com/apppasswords');
            console.error('2. Select "Mail" and "Other (Custom name)"');
            console.error('3. Copy the 16-character password');
            console.error('4. Update EMAIL_PASS in .env file');
        }
    }
};

testEmail();
