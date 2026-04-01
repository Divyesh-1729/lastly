const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: String,

  image: {
    filename: String,
    url: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2023/03/29/10/27/hotel-7885138_1280.jpg",
      set: v =>
        (typeof v === "string" && v.trim() !== "")
          ? v
          : "https://cdn.pixabay.com/photo/2023/03/29/10/27/hotel-7885138_1280.jpg"
    }
  },

  price: { type: Number, required: true },
  location: String,
  country: String,
  category: {
    type: String,
    enum: ['Trending', 'Iconic City', 'Amazing Pools', 'Beach', 'Amazing Views', 'Cabins', 'Lakefront', 'Mountain', 'Castles', 'Camping', 'Farms', 'Arctic'],
    default: 'Trending'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    }
  }
});

//Schema → Defines the structure
//Model → Used to create, read, update, delete data


const Listing = mongoose.model('Listing', listingSchema);
//The first argument 'Listing' is the model name, and Mongoose uses it to create the corresponding MongoDB collection name automatically.
module.exports = Listing;
//module.exports = Listing makes the Listing object available outside this file.