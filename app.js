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

//database
const schemas = require("./src/database/index");

//canvas
let canvas;
loadCanvas().then(async () => {
    canvas = await schemas.canvas.findOne();
    io.emit("canvasState", canvas.canvas);
});

async function loadCanvas() {
    let canvas = await schemas.canvas.findOne();

    if (!canvas) {
        canvas = await new schemas.canvas({
            canvas: []
        }).save();
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

//configure socket.io
io.on("connection", socket => {
    if (!canvas) return;
    socket.emit("canvasState", canvas.canvas);
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
    res.render("pages/index", { user: req.user })
})

app.get("/place", middlewares.authenticated, (req, res) => {

    if (!functions.canJoin(req.user)) return res.render("pages/joinGuild", { user: req.user })

    res.render("pages/place", { user: req.user, width: config.canvas.width, height: config.canvas.height })
})

//api
app.post("/api/pixel", middlewares.authenticated, functions.checkBody([
    {
        name: "x",
        type: "number",
        required: true,
        options: {
            min: 0,
            max: config.canvas.width - 1
        }
    },
    {
        name: "y",
        type: "number",
        required: true,
        options: {
            min: 0,
            max: config.canvas.height - 1
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
    }
]), async (req, res) => {

    if (!functions.canJoin(req.user)) return res.status(403).send({ message: "403: You need to be on the following servers: " + config.settings.onlyInGuilds.join(", ") });

    if (!canvas) return res.status(503).send({ message: "503: Service Unavailable" });

    if (!functions.isColor(req.body.color)) return res.status(400).send({ message: "400: Invalid color" });

    if (config.canvas.allowedColors.length > 0 && !config.canvas.allowedColors.includes(req.body.color)) return res.status(422).send({ message: "422: Color not allowed" });

    if (canvas.canvas[req.body.x][req.body.y].color === req.body.color) return res.status(422).send({ message: "422: Color already set" });

    canvas.canvas[req.body.x][req.body.y] = {
        color: req.body.color,
        user: "testes",
        timestamp: Date.now()
    };

    canvas.markModified(`canvas.${req.body.x}.${req.body.y}`);
    await canvas.save();

    io.emit("pixelUpdate", {
        x: req.body.x,
        y: req.body.y,
        color: req.body.color,
        user: "testes"
    });
    res.status(200).send({ message: `200: Pixel updated: x: ${req.body.x}, y: ${req.body.y}` });
})

//error event
process.on("unhandledRejection", (error) => {
    console.log(error)
})

//server listen
server.listen(process.env.port || config.port, () => {
    console.log(`Server running on port ${process.env.port || config.port}`);
})