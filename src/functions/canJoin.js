const config = require("../../config");
module.exports = (user) => {
    if(config.settings.onlyInGuilds.length > 0){
        if(user.guilds.length < 1) return false;

        if(config.settings.onlyInGuilds.some(id => user.guilds.find(guild => guild.id == id))) return true;

        return false;
    }
    return true;
}