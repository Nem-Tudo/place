module.exports = (req, res, next) => {
    const host = req.get("host");

    try{
        if(host == "localhost:" + (process.env.PORT || config.port)) return next()
        const schema = req.headers["x-forwarded-proto"];
        
        if (schema != "https") {
            res.redirect("https://" + req.get("host") + (req.originalUrl ? req.originalUrl : "/"))
        }
    }catch(e){}

    next();
}