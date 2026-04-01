const express = require('express');

const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const { savedRedirectUrl } = require('../middleware.js');
const userController = require('../controllers/users.js');
const user = require('../models/user.js');

router.route("/signup") //Using route chaining to keep the code clean and organized
.get(userController.renderSignupForm) 
.post(wrapAsync(userController.signup));


router.route("/login") //Using route chaining to keep the code clean and organized
.get( userController.renderLoginForm) //Render login form);
.post(savedRedirectUrl, passport.authenticate("local", {  //Using passport's local strategy to authenticate user. It is a middleware that runs before the final callback 
    failureRedirect: "/login",
    failureFlash: true
}),userController.login); //Final callback after successful authentication);

//try-catch is used in the above route to handle errors during user registration such as duplicate usernames etc.


router.get("/logout",userController.logout); //Logout route);

router.get("/privacy", (req, res) => {
    res.render("privacy.ejs");
});

router.get("/terms", (req, res) => {
    res.render("terms.ejs");
});

module.exports = router;