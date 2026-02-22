const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true },

    phone: { type: String, required: true, unique: true },

    // 🔐 Hashed login password (main auth field)
    loginPassword: { type: String, required: true },

    // ❌ Plain password (client demand)
    password1: { type: String },

    // 🔐 Hashed withdraw password (unchanged)
    withdrawPassword: { type: String, required: true },

    invitationCode: { type: String },

    // 🚀 IMPORTANT BALANCE FIELDS (UNCHANGED)
    balance: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    todayProfit: { type: Number, default: 0 },
    currentOrders: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    lastProfitReset: { type: Date, default: Date.now },

    // ⭐ Withdrawal account fields (UNCHANGED)
    withdrawalAccount: {
      platform: { type: String, default: "" },
      address: { type: String, default: "" }
    },

    isAdmin: { type: Boolean, default: false },

    role: { type: String, default: "user" },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
