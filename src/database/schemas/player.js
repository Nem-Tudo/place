
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    discordId: {
      type: String,
      required: true,
    },
    timeout: {
        type: Number,
        required: true,
        default: 0,
    },
    banned: {
      banned: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        default: "",
      },
      bannedBy: {
        type: String,
        default: "",
      },
      bannedAt: {
        type: Date,
        default: Date.now()
      }
    }
  }
);

module.exports = mongoose.model("Player", playerSchema);