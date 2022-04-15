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

mongoose.plugin(schema => {
    schema.pre('findOneAndUpdate', setRunValidators);
    schema.pre('updateMany', setRunValidators);
    schema.pre('updateOne', setRunValidators);
    schema.pre('update', setRunValidators);
});

function setRunValidators() {
    this.setOptions({ runValidators: true });
}

module.exports = {
    canvas: require('./schemas/canvas'),
    discordUser: require('./schemas/discordUser'),
}