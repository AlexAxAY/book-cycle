const State = require("../../models/stateSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");

const getAddressPage = async (req, res, next) => {
  try {
    const states = await State.find();
    const userId = req.user ? req.user.id : null;
    const user = await User.findOne({ _id: userId });
    return res.render("user/userAddressPage", { states, user });
  } catch (err) {
    next(err);
  }
};

const addressUpdatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const states = await State.find();
    const address = await Address.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found!" });
    }
    return res
      .status(200)
      .render("user/updateAddressPage", { address, states });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
    } = req.body;

    if (
      !name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode ||
      !address_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid name. Name should contain only letters and spaces.",
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. It must be 10 digits.",
      });
    }
    if (alt_phone && !phoneRegex.test(alt_phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alternate phone number. It must be 10 digits.",
      });
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. It must be exactly 6 digits.",
      });
    }

    const user_id = req.user.id;

    const newAddress = new Address({
      name,
      phone,
      address_line,
      landmark: landmark || null,
      alt_phone: alt_phone || null,
      city,
      state,
      pincode,
      address_type,
      user_id,
    });

    await newAddress.save();

    return res
      .status(200)
      .json({ success: true, message: "Address added successfully." });
  } catch (error) {
    next(error);
  }
};

const viewAllAddress = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;

    const user = await User.findOne({ _id: userId });
    const addresses = await Address.find({ user_id: userId });
    return res.render("user/viewAddress", { user, addresses });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Address.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
    } = req.body;

    if (
      !name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode ||
      !address_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid name. Name should contain only letters and spaces.",
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. It must be 10 digits.",
      });
    }
    if (alt_phone && !phoneRegex.test(alt_phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alternate phone number. It must be 10 digits.",
      });
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. It must be exactly 6 digits.",
      });
    }

    const user_id = req.user.id;

    await Address.findByIdAndUpdate(id, {
      name,
      phone,
      address_line,
      landmark: landmark || null,
      alt_phone: alt_phone || null,
      city,
      state,
      pincode,
      address_type,
      user_id,
    });

    return res
      .status(200)
      .json({ success: true, message: "Address updated successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddressPage,
  addAddress,
  viewAllAddress,
  deleteAddress,
  updateAddress,
  addressUpdatePage,
};
