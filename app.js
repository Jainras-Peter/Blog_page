require('dotenv').config();


const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');


const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const app = express();
const PORT = process.env.PORT || 10000;
  
// Connect to DB
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || "mysecret",
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
   cookie:{
        httpOnly: true,
        maxAge: 1000*60*60*24
  }
}));

// app.use(express.static('public'));

// // Templating Engine
// app.use(expressLayout);
// app.set('layout', './layouts/main');
// app.set('view engine', 'ejs');


// app.locals.isActiveRoute = isActiveRoute; 


// app.use('/', require('./server/routes/main'));
// app.use('/', require('./server/routes/admin'));


// app.listen(PORT, ()=> {
//   console.log(`App listening on port ${PORT}`);
// });

//changes
const jwt = require("jsonwebtoken");
const User = require("./server/models/User");
const jwtSecret = process.env.JWT_SECRET;

app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.userId).lean();
      req.user = user;
      res.locals.currentUser = user;
    } catch (err) {
      console.log("JWT error:", err.message);
      req.user = null;
      res.locals.currentUser = null;
    }
  } else {
    req.user = null;
    res.locals.currentUser = null;
  }
  next();
});

app.use(express.static('public'));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


app.locals.isActiveRoute = isActiveRoute; 


app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));


app.listen(PORT, ()=> {
  console.log(`App listening on port ${PORT}`);
});

