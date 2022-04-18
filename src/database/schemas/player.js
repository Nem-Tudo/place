
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
        required: true,
        default: false,
      },
      reason: {
        type: String,
        required: true,
        default: "",
      },
      bannedBy: {
        type: String,
        required: true,
        default: "",
      },
      bannedAt: {
        type: Date,
        required: true,
        default: Date.now()
      }
    }
  }
);

module.exports = mongoose.model("Player", playerSchema);