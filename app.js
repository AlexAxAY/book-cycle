if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const methodOverride = require("method-override");
const path = require("path");
const { createAdmin } = require("./controllers/admin/adminAuth");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const passport = require("passport");

const PORT = process.env.PORT;

const app = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// session middlewares
app.use(
  session({
    secret: process.env.SECRET_KEYS,
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 3600000,
      sameSite: "lax",
    },
    store:
      process.env.NODE_ENV === "production"
        ? yourProductionStore
        : new session.MemoryStore(),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }
  res.locals.currentURL = req.originalUrl;

  next();
});

// permissions middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com"
  );
  next();
});

// DB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/book-cycle")
  .then(() => console.log("Connected to Mongo DB!"))
  .catch((error) => console.log(error));

createAdmin();

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

// G-auth routes
app.use("/", googleAuthRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
