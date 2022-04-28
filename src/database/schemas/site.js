
const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    stats: {
        placePixeis: {
            type: Number,
            default: 0,

        },
        uses: {
            type: Number,
            default: 0,
        }
    },
    sentAdminMessages: {
        type: Array,
        default: [],
    },
    bannedUsersMessages: {
        type: Array,
        default: [],
    },
    bannedUsers: {
        type: Array,
        default: [],
    }
  }
);

module.exports = mongoose.model("Site", siteSchema);