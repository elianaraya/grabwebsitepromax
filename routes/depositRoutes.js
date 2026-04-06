const router = require("express").Router();
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/deposits");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const User = require("../models/User"); // 👈 ADD THIS

const {
  requestDeposit,
  listDeposits,
  approveDeposit,
  rejectDeposit,
} = require("../controllers/depositController");

// ===============================
// ✅ NEW → GET USER DEPOSIT ADDRESS
// ===============================
router.get("/address", auth, async (req, res) => {
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
    console.error("getDepositAddress error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ===============================
// 🔽 OLD SYSTEM (UNCHANGED)
// ===============================

// USER → Create deposit request (with screenshot)
router.post("/request", auth, upload.single("screenshot"), requestDeposit);

// ADMIN → List all
router.get("/all", auth, admin, listDeposits);

// ADMIN → Approve deposit
router.post("/approve/:id", auth, admin, approveDeposit);

// ADMIN → Reject deposit
router.post("/reject/:id", auth, admin, rejectDeposit);

module.exports = router;
