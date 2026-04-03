const Listing = require("./models/listing");
const Booking = require("./models/booking");
const ExpressError = require("./utils/ExpressError");
const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");


module.exports.isLoggedIn = (req, res, next) => {
    //console.log(req.path, "..", req.originalUrl);
    if(!req.isAuthenticated()){
        //redirect url save
        req.session.redirectUrl = req.originalUrl;

        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};

module.exports.savedRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req,res,next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
        if(!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
  if (!listing.owner.equals(res.locals.currentUser._id)) {
    req.flash("error", "You do not have permission to edit this listing!"); //Flash message if user is not the owner of the listing
    return res.redirect(`/listings/${id}`);
  }
    next();
};


module.exports.isNotListingOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    
    if (listing.owner.equals(res.locals.currentUser._id)) {
        req.flash("error", "You cannot book your own listing!");
        return res.redirect(`/listings/${id}`);
    }
    
    next();
};

module.exports.isBookingOwner = async (req, res, next) => {
    let { id } = req.params;
    let booking = await Booking.findById(id);
    
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }
    
    if (!booking.user.equals(res.locals.currentUser._id)) {
        req.flash("error", "You do not have permission to access this booking!");
        return res.redirect("/bookings");
    }
    
    next();
};


module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body); //Validating using Joi schema -- check if req.body satisfies the schema
   
   if(error){
    let errMsg = error.details.map(el => el.message).join(','); //Mapping through error details to get messages
    throw new ExpressError(errMsg, 400); //Passing to the generic error handler middleware (message, statusCode)
    }
    else{
        next();
    }
};


module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(errMsg, 400);
    }
    else{
        next();
    }
};


module.exports.isReviewAuthor = async (req,res,next) => {
    let {reviewId} = req.params;
    let review = await Review.findById(reviewId);
  if (!review.author.equals(res.locals.currentUser._id)) {
    req.flash("error", "You do not have permission to delete this review!"); //Flash message if user is not the author of the review
    return res.redirect(`/listings/${req.params.id}`);
  }
    next();
};