const config = require("../../config");
module.exports = (user) => {
    return true;
    if(config.settings.onlyInGuilds.length > 0){
        if(user.guilds.length < 1) return false;

        if(config.settings.onlyInGuilds.some(id => !user.guilds.find(guild => guild.id == id))) return false;
    }
    return true;
}