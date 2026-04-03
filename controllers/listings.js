const Listing = require("../models/listing.js");
const { forwardGeocode } = require("../utils/geocode.js");



module.exports.index = async (req, res) => {
    let filter = {};
    if(req.query.category) {
        filter.category = req.query.category;
    }
    const allListings = await Listing.find(filter);
    res.render("listings/index", {allListings, selectedCategory: req.query.category || null});
};



module.exports.renderNewForm = (req, res) => {
    //console.log(req.user);

    res.render("listings/new");
}


module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path : 'reviews', populate: {path: 'author'}}).populate('owner');//Pass this in show.ejs...Nested populate to get author of each review
    console.log(listing);
    if(!listing){
        req.flash("error", "Listing not found!"); //Flash message if listing not found
        res.redirect("/listings");
        return;
    }

   if (!listing.geometry?.coordinates?.length) {
        const geo = await forwardGeocode([listing.location, listing.country].filter(Boolean).join(", "));
        if (geo) {
            listing.geometry = { type: "Point", coordinates: [geo.lng, geo.lat] };
            await listing.save();
        }
    }
    res.render("listings/show", {listing});
}



module.exports.createListing = async (req, res) => { //validateListing is middleware to validate the data before creating a new listing

    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url, "..", filename);
   
    let{title, description, image, price, location, country, category} = req.body;
    const newListing = new Listing({
        title,
        description,
        image,
        price,
        location,
        country,
        category,
    });
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    const geo = await forwardGeocode([location, country].filter(Boolean).join(", "));
    if (geo) {
        newListing.geometry = { type: "Point", coordinates: [geo.lng, geo.lat] };
    }
    
    await newListing.save();
    req.flash("success", "Successfully created a new listing!"); //Flash message after creating a new listing --Part of flash messages implementation
    res.redirect("/listings"); 
    console.log(newListing);
}




module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing =  await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing not found!"); //Flash message if listing not found
        return res.redirect("/listings");
    }



    let originalImageUrl = listing.image?.url || "";
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");

    res.render("listings/edit", {listing, originalImageUrl});
}


module.exports.updateListing = async (req, res) => {
  let {id} = req.params;
  
   let listing = await Listing.findByIdAndUpdate(id, req.body ,{runValidators:true, new:true});

   const nextLocation = req.body && req.body.location ? req.body.location : listing.location;
   const nextCountry = req.body && req.body.country ? req.body.country : listing.country;
   const geo = await forwardGeocode([nextLocation, nextCountry].filter(Boolean).join(", "));
   if (geo) {
        listing.geometry = { type: "Point", coordinates: [geo.lng, geo.lat] };
   }

   if(typeof req.file !== 'undefined'){  //typeof req.file is used to check if a new image is uploaded or not. If a new image is uploaded, then we need to update the image field in the database with the new image URL and filename.
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    await listing.save();
    }
    else{
        await listing.save();
    }

    req.flash("success", "Successfully updated the listing!"); //Flash message after updating a listing
    res.redirect("/listings");
}



module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Successfully deleted the listing!"); //Flash message after deleting a listing
    res.redirect("/listings");
}

module.exports.searchListings = async (req, res) => {
    let {q} = req.query;
    if(!q) {
        req.flash("error", "Please enter a search term!");
        return res.redirect("/listings");
    }

    const searchResults = await Listing.find({
        $or: [
            {title: {$regex: q, $options: 'i'}},
            {location: {$regex: q, $options: 'i'}},
            {country: {$regex: q, $options: 'i'}}
        ]
    });

    res.render("listings/index", {allListings: searchResults, selectedCategory: null});
}