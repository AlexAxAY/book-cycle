if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const cors = require("cors");
const methodOverride = require("method-override");
const path = require("path");
const passport = require("passport");
const flash = require("connect-flash");

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const {
  customMiddleware,
  setHeaderMiddleware,
} = require("./middleware/main/appMiddlewares");
const connectDB = require("./config/mongo");
const {
  invalidURL,
  errorHandler,
} = require("./middleware/main/errorHandlingMiddleware.js");

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

// session middleware
app.use(
  session({
    secret: process.env.SECRET_KEYS,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 3600000,
      sameSite: "lax",
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO,
      collectionName: "sessions",
    }),
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// custom session assigning middleware
app.use(customMiddleware);

// headers
app.use(setHeaderMiddleware);

// DB connection
connectDB();

// routes
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

// G-auth route
app.use("/", googleAuthRoutes);

// Error handling middleware
app.use(invalidURL);
app.use(errorHandler);

app.listen(PORT);
