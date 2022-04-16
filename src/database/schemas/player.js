
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
        type: Boolean,
        required: true,
        default: false,
    }
  }
);

module.exports = mongoose.model("Player", playerSchema);