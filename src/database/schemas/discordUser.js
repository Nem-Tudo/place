
const mongoose = require('mongoose');

const discordUserSchema = new mongoose.Schema(
  {
    discordId: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    guilds: {
      type: Array,
      required: true,
    },
    avatar: {
      type: String
    },
    avatarURL: {
      type: String
    }
  }
);

module.exports = mongoose.model("DiscordUser", discordUserSchema);