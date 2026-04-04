const Booking = require('../models/booking');
const Listing = require('../models/listing');
const User = require('../models/user');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendBookingConfirmation, sendCancellationEmail } = require('../utils/emailService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Show booking form
module.exports.renderBookingForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    
    res.render('bookings/book', { listing });
};

// Create booking and initialize Razorpay order
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { checkInDate, checkOutDate } = req.body;
    
    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
        req.flash('error', 'Check-out date must be after check-in date!');
        return res.redirect(`/listings/${id}/book`);
    }
    
    if (checkIn < new Date()) {
        req.flash('error', 'Check-in date must be in the future!');
        return res.redirect(`/listings/${id}/book`);
    }
    
    const listing = await Listing.findById(id);
    
    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
        listing: id,
        paymentStatus: 'completed',
        $or: [
            { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
        ]
    });
    
    if (overlappingBooking) {
        req.flash('error', 'This listing is already booked for selected dates!');
        return res.redirect(`/listings/${id}/book`);
    }
    
    // Calculate total price
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price;
    
    // Create Razorpay order
    const options = {
        amount: totalPrice * 100, // Convert to paise
        currency: 'INR',
        receipt: `booking_${Date.now()}`,
        notes: {
            listing_id: id,
            user_id: req.user._id.toString()
        }
    };
    
    const order = await razorpay.orders.create(options);
    
    // Create booking with pending status
    const booking = new Booking({
        listing: id,
        user: req.user._id,
        checkInDate,
        checkOutDate,
        totalPrice,
        razorpayOrderId: order.id,
        paymentStatus: 'pending'
    });
    
    await booking.save();
    
    // Add booking to user and listing
    await User.findByIdAndUpdate(req.user._id, { $push: { bookings: booking._id } });
    await Listing.findByIdAndUpdate(id, { $push: { bookings: booking._id } });
    
    res.render('bookings/payment', { 
        booking, 
        order, 
        listing,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID 
    });
};

// Verify Razorpay payment
module.exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { id } = req.params;
    
    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error('[Payment] Missing payment verification data');
        req.flash('error', 'Invalid payment data!');
        req.session.save(() => {
            return res.json({ success: false, redirectUrl: '/bookings' });
        });
        return;
    }
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
    
    console.log('[Payment] Verifying payment signature...');
    
    if (expectedSignature === razorpay_signature) {
        console.log('[Payment] ✓ Signature verification successful');
        
        // Payment verified
        const booking = await Booking.findById(id).populate('user').populate('listing');
        
        if (!booking) {
            console.error(`[Payment] Booking not found with ID: ${id}`);
            req.flash('error', 'Booking not found!');
            return req.session.save(() => {
                return res.json({ success: false, redirectUrl: '/bookings' });
            });
        }
        
        if (!booking.user || !booking.user.email) {
            console.error('[Payment] User or user email not found in booking');
            req.flash('error', 'User information missing!');
            return req.session.save(() => {
                return res.json({ success: false, redirectUrl: '/bookings' });
            });
        }
        
        booking.paymentStatus = 'completed';
        booking.razorpayPaymentId = razorpay_payment_id;
        await booking.save();
        
        console.log(`[Payment] Booking ${id} marked as completed`);
        
        // Send confirmation email in BACKGROUND (don't wait)
        sendBookingConfirmation(booking.user, booking, booking.listing)
            .then(() => {
                console.log(`✓ Confirmation email sent successfully to ${booking.user.email}`);
            })
            .catch((emailError) => {
                console.error(`✗ Email sending error for ${booking.user.email}:`, emailError.message);
            });
        
        req.flash('success', 'Booking confirmed! Confirmation email will be sent shortly.');
        
        // Save session before sending JSON response to persist flash message
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
            }
            return res.json({ success: true, redirectUrl: '/bookings' });
        });
    } else {
        console.log('[Payment] ✗ Signature verification failed');
        console.log(`Expected: ${expectedSignature}`);
        console.log(`Received: ${razorpay_signature}`);
        
        // Fetch booking for redirect in case of failure
        const booking = await Booking.findById(id).populate('listing');
        req.flash('error', 'Payment verification failed!');
        
        // Save session before sending JSON response
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
            }
            return res.json({ success: false, redirectUrl: `/listings/${booking?.listing?._id || 'bookings'}/book` });
        });
    }
};

// Show all bookings of logged-in user
module.exports.showAllBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate({
            path: 'listing',
            populate: {
                path: 'owner'
            }
        })
        .sort({ createdAt: -1 });
    
    res.render('bookings/myBookings', { bookings });
};

// Show specific booking details
module.exports.showBookingDetails = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id)
        .populate('listing')
        .populate('user');
    
    if (!booking) {
        req.flash('error', 'Booking not found!');
        return res.redirect('/bookings');
    }
    
    res.render('bookings/bookingDetails', { booking });
};

// Cancel booking
module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('user').populate('listing');
    
    if (!booking) {
        req.flash('error', 'Booking not found!');
        return res.redirect('/bookings');
    }
    
    if (booking.paymentStatus === 'completed') {
        req.flash('error', 'Cannot cancel a completed booking!');
        return res.redirect(`/bookings/${id}`);
    }
    
    // Validate user and booking data before sending email
    if (booking.user && booking.user.email && booking.listing) {
        // Send cancellation email in BACKGROUND (don't wait)
        sendCancellationEmail(booking.user, booking, booking.listing)
            .then(() => {
                console.log(`✓ Cancellation email sent successfully to ${booking.user.email}`);
            })
            .catch((emailError) => {
                console.error(`✗ Cancellation email error for ${booking.user.email}:`, emailError.message);
            });
    } else {
        console.warn('[Booking] Missing user/listing data for cancellation email');
    }
    
    await Booking.findByIdAndDelete(id);
    await User.findByIdAndUpdate(req.user._id, { $pull: { bookings: id } });
    await Listing.findByIdAndUpdate(booking.listing._id, { $pull: { bookings: id } });
    
    req.flash('success', 'Booking cancelled successfully!');
    res.redirect('/bookings');
};