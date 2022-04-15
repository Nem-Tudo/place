module.exports = (req, res, next) => {
    
    if(req.isAuthenticated()) return next();

    if(req.method === 'GET'){
        res.redirect("/oauth2/login");
    } else {
        res.status(401).send("401: Not authenticated");
    }
    
    
}