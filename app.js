//jshint esversion:6
import dotenv from "dotenv"; 
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import {MongoClient} from 'mongodb';
dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

const url = process.env.MONGODB_URI;

// sundesh me vash kai lhpsh data gia dashboards kai alarms//

// const database = client.db('worldBreath');
// const dataBme688 = database.collection('bme688');
// const data = dataBme688.find();
// console.log(data);

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  let dbo = db.db("worldBreath");
  //Find all documents in the bme688 collection:
  // dbo.collection("bme688").find({}).toArray(function(err, result) {
  //   if (err) throw err;
  //   console.log(result);
  //   db.close();
  // });
  //  projection: { _id: 0, payload: 1}
  dbo.collection("bme688").find({}, { sort: { timestamp: -1 }, limit: 2 }).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result);
    for (const el of result) {
      // console.log(el.payload.temperature);
    }
    
  });

  dbo.collection("ccs811").find({}, { sort: { timestamp: -1 }, limit: 2 }).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result);
    for (const el of result) {
      console.log(el.payload.eCO2,el.payload.TVOC);
    }
    db.close();
  });
});

let totalEmissions;
let periodOfConsumption;
// sundesh me vash kai lhpsh data gia dashboards kai alarms//

// user authentication 
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session());

//const uri = process.env.ATLAS_URI;
const uri = process.env.ATLAS_URI;
mongoose.connect(uri)

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// user authentication//








app.get("/",function(req,res) {
  res.render("worldBreath");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/home", function(req,res) {
  // The below line was added so we can't display the "/secrets" page
  // after we logged out using the "back" button of the browser, which
  // would normally display the browser cache and thus expose the 
  // "/secrets" page we want to protect. Code taken from this post.
  res.set(
      'Cache-Control', 
      'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );
  if(req.isAuthenticated()) {
      res.render("home",{temp: 25});        
  } else {
      res.redirect("/login");
  }
});

// app.get("/home",function(req, res){
//   res.render("home",{temp: 25});
// });

app.get("/logout",(req,res)=>{
  req.logout((err)=>{
      if(err){
          console.log(err);
      } else{
          res.redirect("/");
      }
  });
});

app.post("/register", function (req,res) {
  User.register({username: req.body.username}, req.body.password, function (err,user) {
      if(err){
          console.log(err);
          res.redirect("/register");
      }else{
          passport.authenticate("local")(req,res, function () {
              res.redirect("/home"); //isws ton stelnw sto login
          })
      }
  })
});

app.post("/login", 
    passport.authenticate("local", {failureRedirect: "/"}), function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password     
    });
    req.login(user, function(err) {
        if(err) {
            //console.log(err);
            res.redirect("/register")
        } else {
            res.redirect("/home");
        }
    });
});

app.get("/home/setAlarm",function(req, res){
  res.render("setAlarm");
});

app.get("/dashboard",function(req, res){
  res.render("dashboard");
});

app.get("/dashboard/livingRoom",function (req,res) {
  res.render("livingRoom");  
});

app.get("/dashboard/fireplace",function (req,res) {
  res.render("fireplace");  
});

app.get("/qrCode",function (req,res) {
  res.render("qrCode");
});

app.get("/footprint",function (req,res) {
  res.render("footprint",{totalEmissions:totalEmissions,
  periodOfConsumption: periodOfConsumption});
});

app.post("/footprint",function(req,res){
  periodOfConsumption = req.body.period;
  let electricityConsumption = req.body.electricity;
  // console.log(electricityConsumption);
  // console.log(periodOfConsumption);

  //UK CO2(eq) emissions due to electricity generation
    const CO2ePerkWh = 0.23314; //kg CO2e per kWh
    const electricityEmissions = electricityConsumption * CO2ePerkWh;
    const emissionsFireplace = 1000;

    let etotalEmissions = electricityEmissions + emissionsFireplace;
    totalEmissions = etotalEmissions;

  res.redirect("/footprint");
});





app.get("/profile",function (req,res) {
  res.render("profile");
});


let port = process.env.PORT || '3000';

const server = app.listen(port, () => { console.log("Περιμένω αιτήματα στο port " + port) });
