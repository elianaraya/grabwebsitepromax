const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ADMIN UPDATE BALANCE BY INVITATION CODE
router.post("/update-balance", async (req, res) => {
  try {
    const { invitationCode, amount } = req.body;

    if (!invitationCode || amount === undefined) {
      return res.status(400).json({ message: "Invite code & amount required" });
    }

    const user = await User.findOne({ invitationCode });

    if (!user) {
      return res.status(404).json({ message: "User not found with this invite code" });
    }

    user.balance = (user.balance || 0) + amount;
    user.totalBalance = (user.totalBalance || 0) + amount;

    await user.save();

    res.json({
      success: true,
      message: "Balance updated successfully",
      user
    });

  } catch (err) {
    console.error("update-balance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
 
router.get("/user-by-invite/:code", async (req, res) => {
    try {
      const user = await User.findOne({ invitationCode: req.params.code });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      return res.json({
        success: true,
        user,
      });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });

  router.put("/reset-user-field/:id", async (req, res) => {
    try {
      const { field, value } = req.body;
      const userId = req.params.id;
  
      if (!field) {
        return res.status(400).json({ success: false, message: "Field is required" });
      }
  
      const allowed = ["balance", "todayProfit", "totalBalance", "totalOrders"];
  
      if (!allowed.includes(field)) {
        return res.status(400).json({ success: false, message: "Invalid field" });
      }
  
      const updateObj = {};
      updateObj[field] = value;
  
      await User.findByIdAndUpdate(userId, updateObj);
  
      return res.json({ success: true, message: `${field} reset successfully` });
  
    } catch (err) {
      console.log("Reset field error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  router.put("/update-withdrawal-account/:id", async (req, res) => {
    try {
      const { platform, address } = req.body;
      const userId = req.params.id;
  
      if (!platform || !address) {
        return res.status(400).json({ success: false, message: "All fields required" });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      user.withdrawalAccount = {
        platform,
        address
      };
  
      await user.save();
  
      return res.json({
        success: true,
        message: "Withdrawal account updated",
        user
      });
    } catch (err) {
      console.log("updateWithdrawalAccount error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });
  // ===============================
//   SET DEPOSIT WALLET (ADMIN)
// ===============================
router.post("/set-deposit-wallet", async (req, res) => {
  try {
    const { invitationCode, address, network } = req.body;

    if (!invitationCode || !address) {
      return res.status(400).json({
        success: false,
        message: "Invitation code & address required"
      });
    }

    const user = await User.findOne({ invitationCode });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ YAHAN MAIN LOGIC
    user.depositWallet = {
      address,
      network: network || "TRC20"
    };

    await user.save();

    res.json({
      success: true,
      message: "Deposit wallet updated successfully",
      depositWallet: user.depositWallet
    });

  } catch (err) {
    console.error("set-deposit-wallet error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
