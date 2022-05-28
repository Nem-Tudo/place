module.exports = {
    port: 1516,
    settings: {
        onlyInGuilds: ["893246472043261983"],
        moderatorUsers: ["612651439701098558"],
        adminUsers: ["612651439701098558", "321684831857672192", "407689546864787466", "869710697439842355"]
    },
    database: {
        connectURL: "mongodb+srv://NemTudo:%24%24Gustavo15%24%24@cluster0.3xiug.mongodb.net/NeonPlace?retryWrites=true&w=majority"
    },
    canvas: {
        height: 480,
        width: 480,
        allowedColors: [],
        timeout: 30 * 1000
    },
    oauth2: {
        clientID: "957266200616919041",
        passportSecret: "TNqkZaA7SZQdcbFy892yDPt2vHnJSGFZCPZx4ZJcqzF5Hzco",
        clientSecret: "bWRGMUhpnx-CsTfD1pLxd9Z4RSa6c3Tj",
        callbackURL: "/oauth2/redirect",
        scope: ["identify", "guilds"]
    },
    discord: {
        cdn: "https://cdn.discordapp.com",
        avatar: {
            path: "/avatars",
            extension: ".webp"
        }
    }
}