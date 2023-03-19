require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Database
const uri = process.env.MONGODB_URI;
const db = "userDB";
const fullUri = `${uri}/${db}`;

mongoose.connect(fullUri);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', function(req, res) {
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


// Login existing user
app.get('/login', function(req, res) {
    res.render("login");
});

app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const user = new User({
        username: username,
        password: password,
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
            res.redirect('/login');
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
});

app.get("/secrets", function(req, res){
    console.log("Before checking auth ---");
    if(req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
})

app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});


// Register New user
app.get('/register', function(req, res) {
    res.render("register");
});

app.post('/register', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const newUser = new User({
        username: username,
    });

    User.register(newUser, password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    });
});



app.listen(3000, function() {
    console.log("App listening on port 3000");
});