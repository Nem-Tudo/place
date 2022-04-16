const mongoose = require('mongoose');
const config = require('../../config.js');

    mongoose.connect(config.database.connectURL, {
        useNewUrlParser: true
    })
    .then(() => {
        console.log("Connected in the Database")
    })
    .catch((error) => {
        console.log("Error connecting to database: " + error)
    });

module.exports = {
    canvas: require('./schemas/canvas'),
    discordUser: require('./schemas/discordUser'),
    player: require('./schemas/player'),
}