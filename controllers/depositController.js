// backend/controllers/depositController.js
const DepositRequest = require("../models/DepositRequest");
const User = require("../models/User");

// USER → create deposit request
exports.requestDeposit = async (req, res) => {
  try {
    const { amount, method, details, invitationCode } = req.body;
    const screenshot = req.file ? req.file.filename : null;
    const userId = req.user.id;

    let parsedDetails = {};
    try { parsedDetails = JSON.parse(details); } catch {}

    const dep = await DepositRequest.create({
      user: userId,
      amount,
      method,
      details: parsedDetails,
      invitationCode,
      paymentScreenshot: screenshot,
      status: "pending",
    });

    res.status(201).json({ success: true, deposit: dep });
  } catch (err) {
    console.error("requestDeposit error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ADMIN → Get all deposits (ARRAY)
exports.listDeposits = async (req, res) => {
  try {
    const list = await DepositRequest.find()
      .populate("user", "name nickname email invitationCode")
      .sort({ createdAt: -1 });

    return res.json(list); // PURE ARRAY ✔
  } catch (err) {
    console.error("listDeposits error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ADMIN → approve deposit
exports.approveDeposit = async (req, res) => {
  try {
    const dep = await DepositRequest.findById(req.params.id);
    if (!dep) return res.status(404).json({ message: "Not found" });

    const user = await User.findById(dep.user);

    // Add balance
    user.balance += dep.amount;
    user.totalBalance += dep.amount;
    await user.save();

    // Delete request after approve
    await DepositRequest.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Deposit approved & request removed"
    });

  } catch (err) {
    console.error("approveDeposit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ADMIN → reject deposit (and delete)
exports.rejectDeposit = async (req, res) => {
  try {
    const dep = await DepositRequest.findById(req.params.id);
    if (!dep) return res.status(404).json({ message: "Not found" });

    await DepositRequest.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Deposit request deleted" });
  } catch (err) {
    console.error("rejectDeposit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDepositAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.depositWallet?.address) {
      return res.json({
        success: false,
        message: "Deposit address not set"
      });
    }

    res.json({
      success: true,
      address: user.depositWallet.address,
      network: user.depositWallet.network
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
