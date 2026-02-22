const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================
//        SIGNUP
// ==========================
exports.signup = async (req, res) => {
  try {
    const { nickname, phone, loginPassword, withdrawPassword, invitationCode } = req.body;

    // Check required fields
    if (!nickname || !phone || !loginPassword || !withdrawPassword) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Check if phone already exists
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // Invitation Code required
    if (!invitationCode || invitationCode.trim() === "") {
      return res.status(400).json({
        message: "Invitation code is required"
      });
    }

    // Check if invitation code already used
    const alreadyUsed = await User.findOne({ invitationCode });
    if (alreadyUsed) {
      return res.status(400).json({
        message: "This invitation code is already registered. Try another one."
      });
    }

    // Hash passwords
    const hashedLogin = await bcrypt.hash(loginPassword, 10);
    const hashedWithdraw = await bcrypt.hash(withdrawPassword, 10);

    const finalInviteCode = invitationCode.trim();

    // Create new user
    const newUser = await User.create({
      nickname,
      phone,
      loginPassword: hashedLogin,     // hashed
      password1: loginPassword,       // 🔥 plain password (client demand)
      withdrawPassword: hashedWithdraw,
      invitationCode: finalInviteCode
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ==========================
//          LOGIN
// ==========================
exports.login = async (req, res) => {
  try {
    const { phone, loginPassword } = req.body;

    if (!phone || !loginPassword) {
      return res.status(400).json({ message: "Phone & Password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 🔥 STEP 1: Check plain password
    if (loginPassword !== user.password1) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // 🔥 STEP 2: Auto-sync hash (if admin manually changed password1)
    const hashMatch = await bcrypt.compare(loginPassword, user.loginPassword);

    if (!hashMatch) {
      user.loginPassword = await bcrypt.hash(loginPassword, 10);
      await user.save();
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        nickname: user.nickname,
        phone: user.phone,
        invitationCode: user.invitationCode
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ==========================
//        GET ALL USERS
// ==========================
exports.getAllUsers = async (req, res) => {
  try {
    // 🔒 hide both hashed and plain password
    const users = await User.find().select("-loginPassword -password1 -withdrawPassword");
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// =============================
//   GET LOGGED-IN USER PROFILE
// =============================
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "nickname invitationCode balance totalBalance todayProfit currentOrders totalOrders phone isAdmin role"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        nickname: user.nickname,
        phone: user.phone,
        invitationCode: user.invitationCode,
        balance: user.balance || 0,
        totalBalance: user.totalBalance || 0,
        todayProfit: user.todayProfit || 0,
        currentOrders: user.currentOrders || 0,
        totalOrders: user.totalOrders || 0,
        isAdmin: user.isAdmin,
        role: user.role
      }
    });

  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
