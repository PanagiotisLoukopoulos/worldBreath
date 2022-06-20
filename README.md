# About project
Uunderstanding the importance of uncontrolled environmental pollution, we will propose an application that aims to reduce air pollution. Our main goal is to cultivate the ecological consciousness of the user through the real-time monitoring of the pollutants it produces in the environment and the control of the indoor air quality. Through the application the user will be able to see in real time the pollutants he produces in the environment (e.g., from his fireplace), to see the emissions of various gases increase (in the environment but also indoors) from unwanted bad habits such as throwing paper or cigarette butts in the fireplace and gaining ecological consciousness by stopping such bad habits. It will also have control over the quality of the air it breathes indoors, and our application will help improve its health. (e.g., with notifications as open window increased co2) In the end he will be able to see his overall individual footprint and the pollutants of others and turn to more ecological solutions. He will gain social consciousness and will understand his individual responsibility towards the environment and his fellow human beings.
# Pre-requisites
Install Node.js version 16.15.0
# Getting started
- Clone the repository
```
git clone https://github.com/PanagiotisLoukopoulos/worldBreath.git
```
- Install dependencies
```
cd worldBreath
npm install
```
- Build and run the project
```
npm start
```
Navigate to http://localhost:3000

# Project Structure
Name | Description 
--- | --- 
node_modules | Contains all npm dependencies 
public | Contains all ccs styles and images 
views | Contains all ejs files
partials| Contains header and footers
worldBreath.ejs | Contains the registration page 
login.ejs | Contains the login form 
register.ejs | Contains the register form
home.ejs | Contains the home page of the project 
setAlarm.ejs | Contains system alarms
dashboards.ejs| Contains system information like sensors data and charts
qrCode.ejs| Contains the qrCodes that users can scan 
profile.ejs| Contains system information visible by guests 
livingRoom.ejs| Contains data from sensors located in the living Room
fireplace.ejs | Contains data from sensors located in the chimney and a real time chart from MongoDB Atlas
footprint.ejs| Contains the total CO2 functionallity and a world annual emission chart
app.js | Contains all the logic of our project (Routes, DB connection, change streams functionallity, user authentication)

# User Story
- I can login and register.
- I can check my home Air quality
- I can check outdoor Air quality
- I can check indoor and outdoor Air quality index
- I can share my info via qr-Codes
- I can calculate my overall CO2 home footprint considering CO2(eq) emissions due to electricity generation
- I can check annual CO2 emissions for my country
- I can set alarms
- I can check various sensor data like Temperature, humidity and pressure
