require('dotenv').config();
const http = require('http');
const { app,server,io } =require("./src/middleware/socket");
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoute = require('./src/routes/users');
const mainRoutes= require('./src/routes/index');
require('./src/config/passport');


const PORT = process.env.PORT || 3000;

//middleware
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (espress-session)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, //(This cause cookies to be sent over HTTPS)process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Register all routes
app.use('/api', mainRoutes);
app.use('/users',userRoute);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// root route FOR NOW(Change after frontend created)
app.get('/', (req, res) => {
  res.send('API Server is running. No frontend is connected.');
});


// Start the server
server.listen(PORT, () => {
  console.log(`Server + WebSockets running on http://localhost:${PORT}`);
});