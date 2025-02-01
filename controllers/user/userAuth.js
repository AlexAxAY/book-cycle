const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

// login page
const loginForm = async (req, res) => {
  return res.render("user/loginPage", { currentURL: req.originalUrl });
};

// register page
const registerForm = async (req, res) => {
  return res.render("user/registerPage", { currentURL: req.originalUrl });
};

// register user
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords mismatch!" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };

    res
      .status(201)
      .json({ success: true, message: "Registration successful." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    if (email !== user.email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    // If login is successful, set the session with user details
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
    };

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// logout route
const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false });
    }
    res.clearCookie("connect.sid", { path: "/" });
    return res.status(200).json({ success: true });
  });
};
module.exports = { loginForm, registerForm, register, login, logout };
