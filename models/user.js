const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    bookings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Booking'
        }
    ]
});

UserSchema.plugin(passportLocalMongoose); //Adds username, hash and salt fields to store the username, the hashed password and the salt value used during hashing.Not necessary to build fomr scratch authentication system.
module.exports = mongoose.model("User", UserSchema);