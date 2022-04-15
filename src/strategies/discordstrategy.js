const Discordstrategy = require('passport-discord').Strategy
const passport = require('passport');
const config = require('../../config.js')
const discordUser = require('../database/schemas/discordUser')

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser(async (id, done) => {
    try{
        const user = await discordUser.findById(id);
        if (user) done(null, user);

    }catch(err){
        done(err, null)
    }
})

try{
    passport.use(new Discordstrategy({
        clientID: config.oauth2.clientID,
        clientSecret: config.oauth2.clientSecret,
        callbackURL: config.oauth2.callbackURL,
        scope: config.oauth2.scope
    }, async (accessToken, refreshToken, profile, done) => {
        try{
            const user = await discordUser.findOne({discordId: profile.id});
            if (user){
                user.tag = `${profile.username}#${profile.discriminator}`
                user.guilds = profile.guilds;
                user.avatar = profile.avatar;
                user.avatarURL = `${config.discord.cdn}${config.discord.avatar.path}/${profile.id}/${profile.avatar}${config.discord.avatar.extension}`;
                await user.save()
    
                return done(null, user);
            }
            
            const newUser = new discordUser({
                discordId: profile.id,
                tag: `${profile.username}#${profile.discriminator}`,
                guilds: profile.guilds,
                avatar: profile.avatar,
                avatarURL: `${config.discord.cdn}${config.discord.avatar.path}/${profile.id}/${profile.avatar}${config.discord.avatar.extension}`
            });
        
            const savedUser = await newUser.save();
            done(null, savedUser);
        }catch(error){
            console.error(error);
            return done(error, null);
        }
    }));
}catch(error){
    console.log(error)
}