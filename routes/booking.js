const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, isNotListingOwner, isBookingOwner } = require('../middleware');
const bookingController = require('../controllers/booking');

// Show booking form for a listing
router.get('/listings/:id/book', isLoggedIn, isNotListingOwner, wrapAsync(bookingController.renderBookingForm));

// Create booking and initialize Razorpay order
router.post('/listings/:id/book', isLoggedIn, isNotListingOwner, wrapAsync(bookingController.createBooking));

// Handle Razorpay payment callback
router.post('/bookings/:id/payment-callback', isLoggedIn, wrapAsync(bookingController.verifyPayment));

// Show all bookings of logged-in user
router.get('/bookings', isLoggedIn, wrapAsync(bookingController.showAllBookings));

// Show specific booking details
router.get('/bookings/:id', isLoggedIn, isBookingOwner, wrapAsync(bookingController.showBookingDetails));

// Cancel booking
router.delete('/bookings/:id', isLoggedIn, isBookingOwner, wrapAsync(bookingController.cancelBooking));

module.exports = router;
