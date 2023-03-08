require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const md5 = require('md5');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Database
const uri = process.env.MONGODB_URI;
const db = "userDB";
const fullUri = `${uri}/${db}`;

mongoose.connect(fullUri);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

app.get('/', function(req, res) {
    res.render("home");
});


// Login existing user
app.get('/login', function(req, res) {
    res.render("login");
});

app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({username: username})
        .then(function(response) {
            if(response) {
                if(response.password === password) {
                    res.render("secrets")
                }
            } else {
                res.send("Failed to login, invalid credentials");
            }
        })
        .catch(function(error) {
            console.log(error);
            res.send("Error logging in.");
        })
});


// Register New user
app.get('/register', function(req, res) {
    res.render("register");
});

app.post('/register', function(req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    const newUser = new User({
        username: username,
        password: password,
    });

    newUser.save().then((response) => {
        if(response) {
            res.render('secrets');
        } else {
            res.send("Failed to create new user");
        }
    }).catch((error) => {
        console.log(error);
        res.send("Error creating new User.");
    })
});



app.listen(3000, function() {
    console.log("App listening on port 3000");
});