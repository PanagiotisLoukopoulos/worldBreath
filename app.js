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

// bme688 values to send at ui
let temperature_bme688 = 0;
let pressure_bme688 = 0;
let humidity_bme688 = 0;
let gas_bme688= 0;
//ccs811 values to send at ui
let eCO2_ccs811=0;
let TVOC_ccs811=0;
let date_ccs811;

//sgp30 values to send at ui
let tvoc_sgp30=0;
let eco2_sgp30=0;
let overall_air_quality_sgp30;

//........................................total eco2 from fireplace (every 1 min update value)...................................//

let total = 0;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  let dbo = db.db("worldBreath");
  
  setInterval(function() {
    dbo.collection("ccs811").find({}).toArray(function(err, result) {
      total = 0;
      if (err) throw err;
      //console.log(result);
      for (const el of result) {
       // console.log(typeof(el.payload.tvoc));
        total = total + el.payload.eCO2;
      }
      console.log(total);
      
      //db.close();
    });
}, 60000);
 
});

//................................Change streams FOR collections bme688,ccs811,sgp30 ...................................//
async function main() {
    
  /**
   * The Mongo Client you will use to interact with your database
   * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
   * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
   * pass option { useUnifiedTopology: true } to the MongoClient constructor.
   * const client =  new MongoClient(uri, {useUnifiedTopology: true})
   */
  const client = new MongoClient(url, {useUnifiedTopology: true});

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      // upologismos me aggregate apo Atlas
      //await averageCo2(client);

      // Make the appropriate DB calls
      await monitorBme688(client);
      await monitorSgp30(client);
      await monitorCcs811(client);
  }catch(error){
    console.log(error);
  }
}

main().catch(console.error);

// //............................................//
// // !!! change stream for collection bme688 !!!//
// //............................................//
async function monitorBme688(client, pipeline = []) {
  const collection = client.db("worldBreath").collection("bme688");
  const changeStream = collection.watch(pipeline);
  // ChangeStream inherits from the Node Built-in Class EventEmitter (https://nodejs.org/dist/latest-v12.x/docs/api/events.html#events_class_eventemitter).
  // We can use EventEmitter's on() to add a listener function that will be called whenever a change occurs in the change stream.
  // See https://nodejs.org/dist/latest-v12.x/docs/api/events.html#events_emitter_on_eventname_listener for the on() docs.
  changeStream.on('change', (next) => {
      console.log(next);
      temperature_bme688 = next.fullDocument.temperature;
      pressure_bme688 = next.fullDocument.pressure;
      humidity_bme688 = next.fullDocument.humidity;
      gas_bme688 = next.fullDocument.gas;
  });
  // Wait the given amount of time and then close the change stream
  //await closeChangeStream(timeInMs, changeStream);
}

// //.............OUTDOOR SENSOR...................//
// // !!! change stream for collection CCS811 !!!//
// //............................................//

async function monitorCcs811(client, pipeline = []) {
  const collection = client.db("worldBreath").collection("ccs811");
  const changeStream = collection.watch(pipeline);
  
  changeStream.on('change', (next) => {
      console.log(next);
      eCO2_ccs811 = next.fullDocument.payload.eCO2;
      TVOC_ccs811 = next.fullDocument.payload.TVOC;
      date_ccs811 = next.fullDocument.payload.date;
  });
}

// //............................................//
// // !!! change stream for collection SGP30 !!! //
// //............................................//

async function monitorSgp30(client, pipeline = []) {
  const collection = client.db("worldBreath").collection("sgp30");
  const changeStream = collection.watch(pipeline);
  
  changeStream.on('change', (next) => {
      console.log(next);
      tvoc_sgp30 = next.fullDocument.payload.tvoc;
      eco2_sgp30 = next.fullDocument.payload.eco2;
      overall_air_quality_sgp30 = next.fullDocument.payload.overall_air_quality;
      switch (overall_air_quality_sgp30) {
        case 1:
          overall_air_quality_sgp30 = "Excellent";
          break;
        case 2:
          overall_air_quality_sgp30 = "Good";
          break;
        case 3:
          overall_air_quality_sgp30 = "Moderate";
          break;
        case 4:
          overall_air_quality_sgp30 = "Poor";
          break;
        case 5:
          overall_air_quality_sgp30 = "Unhealthy";  
          break
      } 
  });
}

// mou vgazei undefined ????? (Atlas aggregate sum)

// async function averageCo2(client) {
//   const pipeline = [
//     {
//       '$group': {
//         '_id': null, 
//         'fieldN': {
//           '$sum': '$value'
//         }
//       }
//     }
//   ]
//   const aggCursor = client.db("worldBreath").collection("ccs811").aggregate(pipeline);
//   console.log(aggCursor.total);
// }


let etotalEmissions;
//let totalFootprint = etotalEmissions  + total;
// setInterval(function (params) {
//   console.log("total emission p: " + totalFootprint);

// },2000);
let periodOfConsumption;

// user authentication PASSPORT
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session());


//...... user authentication, h mongo xrhsimopoiei to userSchema protou kanei to connection me thn DB ara 8elw async kai buffer->false?.....................//

mongoose.set('bufferCommands', false);
const UserUri = process.env.ATLAS_URI; 
const connectUser = () => {
  return mongoose.connect(UserUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log(('DB connection successful'));
      return 'Success';
    })
    .catch ((reason) =>  {
      console.log(('Unable to connect to the mongodb instance. Error: '), reason);
      return 'FAIL';
    })
};
connectUser().catch(console.error);
//mongoose.set('bufferTimeoutMS', 20000);


//const uri = process.env.ATLAS_URI;
// const uri = process.env.ATLAS_URI;
// mongoose.connect(uri, {
//   serverSelectionTimeoutMS: 50000 // Timeout after  30s
// })

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//................................................ user authentication.........................................//




//..............................................ROUTES SECTION......................................................//

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
  // The below line was added so we can't display the app pages
  // after we logged out using the "back" button of the browser, which
  // would normally display the browser cache and thus expose the 
  // "app pages" we want to protect. 
  res.set(
      'Cache-Control', 
      'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );
  if(req.isAuthenticated()) {
      res.render("home",{
        overall_air_quality_sgp30: overall_air_quality_sgp30, 
        temperature_bme688:temperature_bme688,
        humidity_bme688:humidity_bme688, 
        eCO2_ccs811: eCO2_ccs811,
        TVOC_ccs811:TVOC_ccs811,
        active1: "active" ,active2: "",active3: "" ,
        active4: "",active5: "" ,active6: ""
      });        
  } else {
      res.redirect("/login");
  }
});

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
              res.redirect("/login"); 
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
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("setAlarm",{active1: "active" ,active2: "",active3: "" ,
  active4: "",active5: "" ,active6: ""});
}else {
  res.redirect("/login");
}
});


// alarm section (an ta stelnw allou, tote tha valw ti alert einai to ka8ena)
app.post("/home/setAlarm",function(req,res){
  //indoor sensor-values/alarms
  let CO2Alarm = req.body.CO2Alarm;
  let VOCAlarm = req.body.VOCAlarm;
  let HumAlarm = req.body.HumAlarm;
  let TempAlarm = req.body.TempAlarm;
  //outdoor sensor-values/alarms
  let Co2OutdoorAlarm = req.body.Co2OutdoorAlarm;
  let VOCOutdoorAlarm = req.body.VOCOutdoorAlarm;
  if (Co2OutdoorAlarm < eCO2_ccs811 ||VOCOutdoorAlarm<TVOC_ccs811 ||CO2Alarm < eco2_sgp30 || VOCAlarm < tvoc_sgp30 || HumAlarm< humidity_bme688 || TempAlarm < temperature_bme688)  {
    res.send(`alert ON` );
  }else{
  res.redirect("/home");
  }

});


app.get("/dashboard",function(req, res){
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("dashboard",{overall_air_quality_sgp30: overall_air_quality_sgp30,eCO2_ccs811: eCO2_ccs811,date_ccs811: date_ccs811,
    active1: "" ,active2: "active",active3: "" ,
        active4: "",active5: "" ,active6: "" });
  }else {
    res.redirect("/login");
}
});


app.get("/dashboard/livingRoom",function (req,res) {
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("livingRoom",{
    eco2_sgp30:eco2_sgp30,
    tvoc_sgp30:tvoc_sgp30,
    humidity_bme688:humidity_bme688, 
    temperature_bme688:temperature_bme688,active1: "" ,active2: "active",active3: "" ,
    active4: "",active5: "" ,active6: "", });
    }else {
    res.redirect("/login");
}
});


app.get("/dashboard/fireplace",function (req,res) {
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("fireplace",{ 
    eCO2_ccs811: eCO2_ccs811,
    TVOC_ccs811:TVOC_ccs811,active1: "" ,active2: "active",active3: "" ,
    active4: "",active5: "" ,active6: "" 
  });
}else {
  res.redirect("/login");
}  
});


app.get("/qrCode",function (req,res) {
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("qrCode",{active1: "" ,active2: "",active3: "active" ,
  active4: "",active5: "" ,active6: ""});
}else {
  res.redirect("/login");
} 
});


app.get("/footprint",function (req,res) {
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
);
if(req.isAuthenticated()) {
  res.render("footprint",{etotalEmissions:etotalEmissions,
  periodOfConsumption: periodOfConsumption,total: total,
  active1: "" ,active2: "",active3: "" ,
  active4: "active",active5: "" ,active6: ""});
}else {
  res.redirect("/login");
} 
});


app.post("/footprint",function(req,res){
  periodOfConsumption = req.body.period;
  let electricityConsumption = req.body.electricity;
  // console.log(electricityConsumption);
  // console.log(periodOfConsumption);

  //UK CO2(eq) emissions due to electricity generation
    const CO2ePerkWh = 0.23314; //kg CO2e per kWh
    const electricityEmissions = electricityConsumption * CO2ePerkWh;
    //const emissionsFireplace = 1000;

    etotalEmissions = electricityEmissions;
    //totalEmissions = etotalEmissions;

  res.redirect("/footprint");
});


app.get("/profile",function (req,res) {
  res.render("profile",{eco2_sgp30:eco2_sgp30,
    tvoc_sgp30:tvoc_sgp30,
    humidity_bme688:humidity_bme688, 
    temperature_bme688:temperature_bme688,eCO2_ccs811: eCO2_ccs811,
    TVOC_ccs811:TVOC_ccs811,
    active1: "" ,active2: "",active3: "" ,
    active4: "",active5: "active" ,active6: ""});
});


// let port = process.env.PORT || '3000';
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => { console.log(`Server is started at port ${port}` ) });
