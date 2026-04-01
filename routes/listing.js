const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');

const { reviewSchema } = require('../schema.js');
const Listing = require('../models/listing.js');
const {isLoggedIn, isOwner, validateListing, validateReview} = require('../middleware.js');  //Import all middlewares from middleware.js
const listingController = require('../controllers/listings.js'); //Importing listing controller to keep the routes file clean and organized
const { render } = require("ejs");
const multer = require('multer');
const { storage } = require('../cloudConfig.js'); //Importing Cloudinary storage configuration for handling image uploads
const upload = multer({ storage }); //This line sets up Multer to handle file uploads, storing them in the uploads directory on the server. You can customize this configuration to specify file size limits, allowed file types, and other options as needed.


router.route("/") //Using route chaining to keep the code clean and organized
//Index route
.get(wrapAsync(listingController.index)) //Using wrapAsync to handle errors in async functions
//CREATE ROUTE
.post(isLoggedIn,upload.single('image'), validateListing, wrapAsync(listingController.createListing)); //wrapAsync is used to handle errors in async functions
//try catch block can be avoided by using wrapAsync
// .post(, (req,res)=>{
//     res.send(req.file);
// });


//New route
router.get("/new", isLoggedIn, listingController.renderNewForm); //isLoggedIn middleware to check if user is logged in before rendering new listing form);

//Search route
router.get("/search", wrapAsync(listingController.searchListings));





 //Show route

router.route("/:id")
.get(wrapAsync(listingController.showListing))   // Data is fetched from MongoDB, passed to the EJS template using res.render, and displayed using listing.property inside <%= %>.

//IMP IF WE MAKE CHANGES IN THE DATABSE THAT ROUTE IS MADE BY ASYNC FUNCTIONS--SHORT TRICK

//Update route
.put(isLoggedIn,isOwner,upload.single('image'), validateListing, wrapAsync(listingController.updateListing)) //isOwner middleware to check if the user is the owner of the listing before updating

//DELETE ROUTE

.delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing));







   



//EDIT Route---This will not have async keyword because we are not making the changes in the database here
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm)); //isOwner middleware to check if the user is the owner of the listing before rendering edit form


    



module.exports = router;