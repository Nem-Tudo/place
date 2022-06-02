module.exports = {
    port: 1516,
    settings: {
        onlyInGuilds: ["893246472043261983", "792948544624525322"],
        moderatorUsers: ["605779926368649216", "500698668983255061", "783844011596316675", "965054116676141086"],
        adminUsers: ["612651439701098558", "407689546864787466", "869710697439842355", "321684831857672192", "905831536216125460", "427257953503019017", "378947631637987328"]
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