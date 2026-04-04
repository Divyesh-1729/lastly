const nodemailer = require('nodemailer');

// Verify credentials exist before creating transporter
const hasEmailCredentials = process.env.SMTP_USER && process.env.SMTP_PASSWORD;

console.log(`[Email Service] SMTP credentials ${hasEmailCredentials ? '✓ LOADED' : '✗ MISSING'}`);

// Create a transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'not-set',
        pass: process.env.SMTP_PASSWORD || 'not-set'
    }
});

// Send booking confirmation email
module.exports.sendBookingConfirmation = async (user, booking, listing) => {
    // Check if credentials are available
    if (!hasEmailCredentials) {
        console.warn('[Email Service] ⚠️ SMTP credentials not configured. Email will not be sent.');
        console.warn(`SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`);
        console.warn(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET'}`);
        return false;
    }

    // Validate user email
    if (!user || !user.email) {
        console.error('✗ User email not found in booking confirmation');
        return false;
    }

    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: `Booking Confirmed - ${listing.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #fe424d; text-align: center;">Booking Confirmation</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333; margin-bottom: 15px;">Thank you for your booking, ${user.username}!</h3>
                        
                        <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                            <p><strong>Booking Reference ID:</strong> ${booking._id}</p>
                            <p><strong>Listing:</strong> ${listing.title}</p>
                            <p><strong>Location:</strong> ${listing.location}, ${listing.country}</p>
                        </div>
                        
                        <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                            <h4 style="color: #333; margin-bottom: 10px;">Booking Details</h4>
                            <p><strong>Check-in Date:</strong> ${new Date(booking.checkInDate).toLocaleDateString()}</p>
                            <p><strong>Check-out Date:</strong> ${new Date(booking.checkOutDate).toLocaleDateString()}</p>
                            <p><strong>Number of Nights:</strong> ${Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))}</p>
                            <p><strong>Price per Night:</strong> ₹${listing.price}</p>
                        </div>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                            <h4 style="color: #333; margin: 0 0 10px 0;">Total Amount Paid</h4>
                            <p style="font-size: 24px; color: #fe424d; margin: 0;">₹${booking.totalPrice}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #4caf50;">
                            <p style="margin: 0; color: #2e7d32;"><strong>✓ Payment Status:</strong> Confirmed</p>
                            <p style="margin: 5px 0 0 0; color: #2e7d32;"><strong>Payment ID:</strong> ${booking.razorpayPaymentId}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            If you have any questions about your booking, please don't hesitate to contact us.
                        </p>
                    </div>
                    
                    <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                        <p>WanderLust © 2026. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        console.log(`[Email] Sending confirmation email to: ${user.email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✓ Booking confirmation email sent successfully to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`✗ Error sending booking confirmation email to ${user.email}:`, error.message);
        console.error('Full error:', error);
        return false;
    }
};

// Send cancellation email
module.exports.sendCancellationEmail = async (user, booking, listing) => {
    // Check if credentials are available
    if (!hasEmailCredentials) {
        console.warn('[Email Service] ⚠️ SMTP credentials not configured. Email will not be sent.');
        return false;
    }

    // Validate user email
    if (!user || !user.email) {
        console.error('✗ User email not found in cancellation email');
        return false;
    }

    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: `Booking Cancelled - ${listing.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #d62828; text-align: center;">Booking Cancelled</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p>Hi ${user.username},</p>
                        
                        <p>Your booking for <strong>${listing.title}</strong> has been cancelled successfully.</p>
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; color: #856404;"><strong>Booking Reference ID:</strong> ${booking._id}</p>
                            <p style="margin: 5px 0 0 0; color: #856404;"><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            If you have any questions, please contact us.
                        </p>
                    </div>
                </div>
            `
        };

        console.log(`[Email] Sending cancellation email to: ${user.email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✓ Cancellation email sent successfully to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`✗ Error sending cancellation email to ${user.email}:`, error.message);
        console.error('Full error:', error);
        return false;
    }
};
