const User = require("../models/user.js");


module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err)
        {
            return next(err);
        }
    });

    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
    };





module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back!");

    res.redirect(res.locals.redirectUrl || "/listings"); //Redirect to saved URL or listings page
};






module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");  //Render login form
};






module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");  //Render signup form
};






module.exports.signup = async (req, res, next) => {
    try {
        let {username, email, password} = req.body; //Destructure username, email and password from req.body
        const newUser = new User({username, email}); //Create a new user object
        const registeredUser = await User.register(newUser, password); //Register the user with the given password
        req.login(registeredUser, err => {  //Automatically log in the user after successful signup
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to WanderLust!"); //Flash message after successful signup
            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};