const config = require("../../config.js")
module.exports = (userid) => {
    return Boolean(config.settings.moderatorUsers.includes(userid) || config.settings.adminUsers.includes(userid));
}