//essentials requires
require("dotenv").config();
const config = require("./config.js")

//server requires
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');

//setup
const server = http.createServer(app);
const io = require('socket.io')(server);

//passport
const MongoStore = require("connect-mongo");
const session = require('express-session');
const passport = require('passport')
require("./src/strategies/discordstrategy")

app.use(session({
    secret: config.oauth2.passportSecret,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    },
    saveUninitialized: false,
    resave: false,
    name: "discord-oauth2",
    store: MongoStore.create({
        mongoUrl: config.database.connectURL,
    })
}))

app.use(passport.initialize())
app.use(passport.session())

//handlers
const functions = require("./src/functions/index");
const middlewares = require("./src/middlewares/index");

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (err, req, res, next) {
    if (err) {
        res.status(400).send({ message: "400: Bad request" })
    } else next()
});


//configure ejs and public
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')))

//redirect to https
app.use(middlewares.redirectHTTPS);

//database
const schemas = require("./src/database/index");

//canvas
let canvas;
loadCanvas().then(async (_canvas) => {
    canvas = _canvas;

    io.to("place").emit("canvasState", {
        canvas: JSON.stringify(canvas.canvas)
    });

    io.emit("reload");

});

async function loadCanvas() {
    let canvas = await schemas.canvas.findOne({});

    if (!canvas) {
        canvas = await new schemas.canvas({
            canvas: []
        }).save();
    }

    if (false) {
        console.log("canvas preserved");
        return canvas;
    }
    console.log("generating canvas...");

    const state = await generateCanvas()

    console.log(`canvas generated! ${state.canvas.length} columns. ${state.canvas[0].length} rows.`);

    return state;

    async function generateCanvas() {
        if (!canvas.canvas) canvas.canvas = [];

        for (let col = 0; col < config.canvas.width; col++) {

            if (!canvas.canvas[col]) canvas.canvas[col] = [];

            for (let row = 0; row < config.canvas.height; row++) {

                if (!canvas.canvas[col][row]) {

                    canvas.canvas[col][row] = {
                        color: "#ffffff",
                        user: null,
                        timestamp: Date.now()
                    }
                }

            }

        }

        return await canvas.save()
    }
}

//siteSchema
let siteSchema;
loadSiteSchema().then(async (_siteSchema) => {
    siteSchema = _siteSchema;
});

async function loadSiteSchema(){
    let siteSchema = await schemas.site.findOne({});

    if (!siteSchema) {
        siteSchema = await new schemas.site({}).save();
    }

    return siteSchema;
}

//save changes in database
let modified = false;
let _saving = false;

setInterval(async () => {

    if (!modified) return;

    if (!canvas) return;

    if (_saving) return;

    _saving = true;

    await canvas.save()
    await siteSchema.save();


    _saving = false;

    modified = false;

}, 5 * 1000)

//uses stats
app.use((req, res, next) => {

    if(req.originalUrl.startsWith("/api")) return next();

    siteSchema.stats.uses++;

    next()
})


//manual change
const playable = {
    canplay: true,
    message: "Não é possível participar no momento. Aguarde."
}

//configure socket.io
io.on("connection", socket => {
    if (!canvas) return;

    if(socket.request._query["canvaspage"] == "true") socket.join("place")

    socket.emit("canvasState", {
        canvas: JSON.stringify(canvas.canvas),
    });

    socket.emit("inPlace", {
        inPlace: socket.rooms.has("place")
    })

    socket.on("getCanvasState", data => {
        socket.emit("canvasState", {
            canvas: JSON.stringify(canvas.canvas)
        })
    })
})

//passport
app.get("/oauth2/logout", (req, res) => {
    req.logout();
    res.redirect("/")
})

app.get("/oauth2/login", passport.authenticate("discord"));
app.get("/oauth2/redirect", passport.authenticate("discord", {
    successRedirect: "/place",
    failureRedirect: "/"
}))

//routes
app.get("/", (req, res) => {
    res.render("pages/index", { user: req.user, accessAdmin: functions.canAccessAdmin(req.user?.discordId)})
})

app.get("/place", middlewares.authenticated, (req, res) => {

    if (!functions.canJoin(req.user)) {
        req.logout();
        return res.render("pages/joinGuild", { user: req.user, accessAdmin: functions.canAccessAdmin(req.user?.discordId)})
    }

    if(!playable.canplay) return res.render("pages/notPlayable", { message: playable.message, user: req.user, accessAdmin: functions.canAccessAdmin(req.user?.discordId)})

    res.render("pages/place", { user: req.user, width: config.canvas.width, height: config.canvas.height})
})

app.get("/admin", middlewares.authenticated, (req, res) => {
    if (!(config.settings.moderatorUsers.includes(req.user?.discordId) || config.settings.adminUsers.includes(req.user?.discordId))) return res.render("pages/notAdmin", {user: req.user});
    
    res.render("pages/admin", { user: req.user, admin: config.settings.adminUsers.includes(req.user?.discordId)});
})


//api
app.post("/api/pixel", middlewares.authenticated, functions.checkBody([
    {
        name: "x",
        type: "number",
        required: true,
        options: {
            min: 0,
            max: config.canvas.width - 1,
            integer: true
        }
    },
    {
        name: "y",
        type: "number",
        required: true,
        options: {
            min: 0,
            max: config.canvas.height - 1,
            integer: true
        }
    },
    {
        name: "color",
        type: "string",
        required: true,
        options: {
            min: 0,
            max: 10
        }
    },
    {
        name: "socketid",
        type: "string",
        required: true
    }
]), async (req, res) => {

    if (!functions.canJoin(req.user)) return res.status(403).send({ message: "403: You need to be on the following servers: " + config.settings.onlyInGuilds.join(", ") });

    if (!canvas) return res.status(503).send({ message: "503: Service Unavailable" });

    if(!playable.canplay) return res.status(503).send({ message: `503: ${playable.message}` });

    if (!functions.isColor(req.body.color)) return res.status(400).send({ message: "400: Invalid color" });

    if (config.canvas.allowedColors.length > 0 && !config.canvas.allowedColors.includes(req.body.color)) return res.status(422).send({ message: "422: Color not allowed. Allowed colors:" + config.canvas.allowedColors.join(", ") });

    const socket = io.sockets.sockets.get(req.body.socketid);

    if (!socket) return res.status(400).send({ message: "400: Invalid socket" });

    const player = await schemas.player.findOne({ discordId: req.user?.discordId });

    if (player.banned.banned) return res.status(403).send({ bannned: true, message: "403: You are banned" });

    if (player.timeout != 0 && player.timeout > Date.now()) return res.status(403).send({ retryAfter: Math.abs(Date.now() - player.timeout), message: `403: You need wait ${Math.abs(Date.now() - player.timeout)}ms before you can place a new pixel.` });

    if (canvas.canvas[req.body.x][req.body.y].color === req.body.color) {

        socket.emit("pixelUpdate", {
            x: req.body.x,
            y: req.body.y,
            color: req.body.color
        })

        return res.status(422).send({ message: "422: Color already set", notResetColor: true});
    }

    //timeout
    let playerState;
    if (config.canvas.timeout > 0) {
        if (!(config.settings.moderatorUsers.includes(req.user?.discordId) || config.settings.adminUsers.includes(req.user?.discordId))) {

            player.timeout = Date.now() + config.canvas.timeout;

            playerState = await player.save();
        }

    }

    const timeout = playerState?.timeout || 0;

    if(!socket.rooms.has("place")) socket.join("place")


    //place pixel
    canvas.canvas[req.body.x][req.body.y] = {
        color: req.body.color,
        user: {
            tag: req.user.tag,
            avatar: req.user.avatar ? req.user.avatarURL : "https://cdn.discordapp.com/embed/avatars/1.png",
        },
        timestamp: Date.now()
    };

    canvas.markModified(`canvas.${req.body.x}.${req.body.y}`);
    modified = true;

    

    io.to("place").emit("pixelUpdate", {
        x: req.body.x,
        y: req.body.y,
        color: req.body.color
    });

    siteSchema.stats.placePixeis++;

    res.status(200).send({ timeout, message: `200: Pixel updated: x: ${req.body.x}, y: ${req.body.y}` });
})

app.get("/api/pixel", middlewares.authenticated, (req, res) => {
    if (!canvas) return res.status(503).send({ message: "503: Service Unavailable" });
    const _x = req.query.x
    const _y = req.query.y;

    if (!_x || !_y) return res.status(400).send({ message: "400: Required query: x, y" });

    const x = Math.floor(Number(_x));
    const y = Math.floor(Number(_y));

    if (isNaN(x) || isNaN(y)) return res.status(400).send({ message: "400: x and y must be numbers" });

    if (x < 0 || y < 0) return res.status(400).send({ message: "400: x and y must be greater than 0" });

    if (x > config.canvas.width - 1 || y > config.canvas.height - 1) return res.status(400).send({ message: "400: x and y must be less than canvas width and height" });

    res.status(200).send({
        x,
        y,
        color: canvas.canvas[x][y].color,
        user: canvas.canvas[x][y].user,
        timestamp: canvas.canvas[x][y].timestamp
    })
})

app.get("/api/player", middlewares.authenticated, async (req, res) => {

    if (!functions.canJoin(req.user)) return res.status(403).send({ message: "403: You need to be on the following servers: " + config.settings.onlyInGuilds.join(", ") });

    if (!canvas) return res.status(503).send({ message: "503: Service Unavailable" });

    const player = req.query.id ? await schemas.player.findOne({ discordId: req.query.id }) : await schemas.player.findOne({ discordId: req.user?.discordId })

    if (!player) return res.status(404).send({ message: "404: Player not found" });

    const user = await schemas.discordUser.findOne({ discordId: player.discordId })

    res.status(200).send({
        discordId: player.discordId,
        user: {
            tag: user.tag,
            avatar: user.avatar,
            avatarURL: user.avatarURL
        },
        timeout: player.timeout,
        banned: player.banned
    });

})

app.get("/api/place", middlewares.authenticated, async (req, res) => {

    if (!functions.canJoin(req.user)) return res.status(403).send({ message: "403: You need to be on the following servers: " + config.settings.onlyInGuilds.join(", ") });

    if (!canvas) return res.status(503).send({
        status: 503,
        message: "503: Service Unavailable",
        customLoadingMessage: "O servidor principal está iniciando... Em alguns minutos o site estará funcionando."
    });

    return res.status(200).send({ status: 200, message: "Server Online" })

})

app.post("/api/admin/ban", middlewares.authenticated, functions.checkBody([
    {
        name: "user",
        type: "string",
        required: true

    }, 
    {
        name: "reason",
        type: "string",
        options: {
            min: 1,
            max: 2048
        }
    }
]), async (req, res) => {
    if(!config.settings.moderatorUsers.includes(req.user?.discordId) && !config.settings.adminUsers.includes(req.user?.discordId)) return res.status(403).send({ message: "403: You need to be a moderator or admin" });
    
    const player = await schemas.player.findOne({ discordId: req.body.user });

    if(!player) return res.status(404).send({ message: "404: Player not found" });

    if(player.banned.banned) return res.status(422).send({ message: "422: Player already banned" });

    if(config.settings.adminUsers.includes(req.body.user)) return res.status(422).send({ message: "422: You can't ban an admin" });

    if(config.settings.moderatorUsers.includes(req.body.user) && !config.settings.adminUsers.includes(req.user?.discordId)) return res.status(422).send({ message: "422: You can't ban a moderator" });

    player.banned.banned = true;
    player.banned.reason = req.body.reason;
    player.banned.bannedBy = req.user?.discordId;
    player.banned.bannedAt = Date.now();

    const state = await player.save();

    const playerDiscord = await schemas.discordUser.findOne({ discordId: player.discordId });

    siteSchema.bannedUsers.push({
        id: playerDiscord.discordId,
        tag: playerDiscord.tag,
        avatar: playerDiscord.avatar,
        avatarURL: playerDiscord.avatarURL,
        reason: state.banned.reason,
        bannedBy: state.banned.bannedBy,
        bannedAt: state.banned.bannedAt
    });

    siteSchema.bannedUsersMessages.push({
        user: player.discordId,
        staff: req.user.tag,
        reason: req.body.reason ?? "Não informado",
        action: "baniu"
    })

    siteSchema.markModified("bannedUsers");
    siteSchema.markModified("bannedUsersMessages");

    return res.status(200).send({ message: "200: Player banned", player: state});
    
})
app.delete("/api/admin/ban", middlewares.authenticated, functions.checkBody([
    {
        name: "user",
        type: "string",
        required: true

    }, 
    {
        name: "reason",
        type: "string",
        options: {
            min: 1,
            max: 2048
        }
    }
]), async (req, res) => {
    if(!config.settings.moderatorUsers.includes(req.user?.discordId) && !config.settings.adminUsers.includes(req.user?.discordId)) return res.status(403).send({ message: "403: You need to be a moderator or admin" });
    
    const player = await schemas.player.findOne({ discordId: req.body.user });

    if(!player) return res.status(404).send({ message: "404: Player not found" });

    if(!player.banned.banned) return res.status(422).send({ message: "422: Player is not banned" });

    if(config.settings.moderatorUsers.includes(req.body.user) && !config.settings.adminUsers.includes(req.user?.discordId)) return res.status(422).send({ message: "422: You can't unban a moderator" });

    player.banned.banned = false;

    const state = await player.save();

    siteSchema.bannedUsers = functions.removeItemArray(siteSchema.bannedUsers, siteSchema.bannedUsers.find(ban => ban.id == player.discordId));

    siteSchema.bannedUsersMessages.push({
        user: player.discordId,
        staff: req.user.tag,
        action: "desbaniu"
    })

    siteSchema.markModified("bannedUsers");
    siteSchema.markModified("bannedUsersMessages");
    
    siteSchema.save();

    return res.status(200).send({ message: "200: Player unbanned", player: state});
    
})

app.get("/api/status", middlewares.authenticated, async (req, res) => {
    if (!functions.canJoin(req.user)) return res.status(403).send({ message: "403: You need to be on the following servers: " + config.settings.onlyInGuilds.join(", ") });
    
    if(!config.settings.moderatorUsers.includes(req.user?.discordId) && !config.settings.adminUsers.includes(req.user?.discordId)) return res.status(403).send({ message: "403: You need to be a moderator or admin" });
    
    if(!siteSchema) return res.status(503).send({ message: "503: Service Unavailable" });

    const response = {};

    if(config.settings.adminUsers.includes(req.user?.discordId)){
        response.stats = JSON.parse(JSON.stringify(siteSchema.stats));
        
        response.stats.online = {};
        response.stats.online.place = io.sockets.adapter.rooms?.get('place')?.size ?? 0;
        response.stats.online.menu = (io.engine.clientsCount - (io.sockets.adapter.rooms?.get('place')?.size ?? 0)) ?? 0;
        
        response.sentAdminMessages = siteSchema.sentAdminMessages;
    }

    response.bannedUsersMessages = siteSchema.bannedUsersMessages;
    response.bannedUsers = siteSchema.bannedUsers;

    return res.status(200).send(response);
})

app.post("/api/admin/eval", middlewares.authenticated, functions.checkBody([
    {
        name: "eval",
        type: "string",
        required: true
    }
]), (req, res) => {
    if(!config.settings.adminUsers.includes(req.user?.discordId)) return res.status(403).send({ message: "403: Missing permission" });

    const code = req.body.eval;

    try {
        const result = eval(code);
        res.status(200).send({ message: "200: Eval successful", result });
    } catch (error) {
        res.status(500).send({ message: "500: Eval failed", result: String(error) });
    }
})

app.post("/api/admin/message", middlewares.authenticated, functions.checkBody([
    {
        name: "message",
        type: "string",
        required: true,
        options: {
            min: 1
        }
    }
]), (req, res) => {
    if(!config.settings.adminUsers.includes(req.user?.discordId)) return res.status(403).send({ message: "403: Missing permission" });

    const message = req.body.message;

    try {
        
        io.emit("eval", {
            eval: `alert("${message}"); console.log("Received message: ${message}");`
        });

        siteSchema.sentAdminMessages.push({
            user: {
                tag: req.user.tag,
                id: req.user?.discordId
            },
            message
        });

        siteSchema.markModified("sentAdminMessages");
        modified = true;
        
        res.status(200).send({ message: `200: Message sent to ${io.engine.clientsCount} users.`, usersCount: io.engine.clientsCount});
    } catch (error) {
        res.status(500).send({ message: "500: Failed on sent message", error: String(error) });
    }
})

process.on("unhandledRejection", (error) => {
    console.log("Received rejection")
    console.log(error)
    console.log("-------------------")
})


//server listen
server.listen(process.env.PORT || config.port, () => {
    console.log(`Server running on port ${process.env.port || config.port}`);
})