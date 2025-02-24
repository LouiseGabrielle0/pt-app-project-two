const router = require("express").Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");


// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

router.post("/signup", isLoggedOut, (req, res) => {
  const { userName, email, password, role} = req.body;

  if (!userName) {
    return res.status(400).render("auth/signup", {
      errorMessage: "Please provide your userName.",
    });
  }

  if (password.length < 8) {
    return res.status(400).render("auth/signup", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)){
    return res.status(400).render("auth/signup", {
      errorMessage: "Please provide a valid email.",
    });
  }

  //   ! This use case is using a regular expression to control for special characters and min length
  /*
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

  if (!regex.test(password)) {
    return res.status(400).render("signup", {
      errorMessage:
        "Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });
  }
  */

  // Search the database for a user with the userName submitted in the form
  User.findOne({ userName }).then((found) => {
    console.log(userName)
    // If the user is found, send the message userName is taken
    if (found) {
      return res
      .status(400)
      .render("auth/signup", { errorMessage: "Username already taken." });
    }
    
    // if user is not found, create a new user - start with hashing the password
    return bcrypt
    .genSalt(saltRounds)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hashedPassword) => {
      // Create a user and save it in the database
      
      userDetails = {
        userName: userName,
        userName: userName,
        email: email,
        role: role,
        passwordHash: hashedPassword,
        }
        return User.create(userDetails)
      })
      .then((user) => {
        console.log('here.....',req.session)
        req.session.user = user;
        if (user.role === "Client"){
          return res.redirect('/client/profile')
        } else {
          return res.redirect("/instructor/profile");
        };
      })
      .catch((error) => {
        console.log(error)
        if (error instanceof mongoose.Error.ValidationError) {
          return res
          .status(400)
          .render("auth/signup", { errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res.status(400).render("auth/signup", {
            errorMessage:
              "Email needs to be unique. The email you choose is already in use.",
          });
        }
        return res
          .status(500)
          .render("auth/signup", { errorMessage: error.message });
      });
  });
});

router.get("/login", isLoggedOut, (req, res) => {
  res.render("auth/login");
});

router.post("/login", isLoggedOut, (req, res, next) => {
  const { userName, password } = req.body;

  if (!userName) {
    return res.status(400).render("auth/login", {
      errorMessage: "Please provide your userName.",
    });
  }

  // Here we use the same logic as above
  // - either length based parameters or we check the strength of a password
  if (password.length < 8) {
    return res.status(400).render("auth/login", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });
  }

  // Search the database for a user with the userName submitted in the form
  User.findOne({ userName })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res.status(400).render("auth/login", {
          errorMessage: "Wrong credentials.",
        });
      }

      // If user is found based on the userName, check if the in putted password matches the one saved in the database
      bcrypt.compare(password, user.passwordHash).then((isSamePassword) => {
        if (!isSamePassword) {
          return res.status(400).render("auth/login", {
            errorMessage: "Wrong credentials.",
          });
        }
        req.session.user = user;
        // req.session.user = user._id; // ! better and safer but in this case we saving the entire user object
        if (user.role === "Client"){
          return res.redirect('/client/homepage')
        } else {
          return res.redirect("/instructor/homepage");
        }
        
      });
    })

    .catch((err) => {
      // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
      // you can just as easily run the res.status that is commented out below
      next(err);
      return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .render("auth/logout", { errorMessage: err.message });
    }
    res.redirect("/");
  });
});

module.exports = router;
