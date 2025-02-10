const State = require("../../models/stateSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");

const getAddressPage = async (req, res) => {
  try {
    const states = await State.find();
    if (!states) {
      console.log("NO states found");
    }
    const userId = req.user ? req.user.id : null;
    if (userId === null) {
      console.log(userId);
    }
    const user = await User.findOne({ _id: userId });
    return res.render("user/userAddressPage", { states, user });
  } catch (err) {
    console.log("Internal error", err);
  }
};

const addressUpdatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const states = await State.find();
    if (!states) {
      console.log("NO states found");
    }
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
    console.log("internal error in addressUpdatePage controller", err);
  }
};

const addAddress = async (req, res) => {
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

    // Create a new address document using your address schema
    const newAddress = new Address({
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
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
    console.error("Error in addAddress controller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const viewAllAddress = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (userId === null) {
      console.log(userId);
    }
    const user = await User.findOne({ _id: userId });
    const addresses = await Address.find();
    return res.render("user/viewAddress", { user, addresses });
  } catch (err) {
    console.log("Internal error", err);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await Address.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.log("Error in deleting the address! ", err);
    return res.status(500).json({
      success: false,
      message: "Server error in deleting the address",
    });
  }
};

const updateAddress = async (req, res) => {
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

    // Create a new address document using your address schema
    await Address.findByIdAndUpdate(id, {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
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
    console.error("Error in updateAddress controller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
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
