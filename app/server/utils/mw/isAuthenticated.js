module.exports = function isAuthenticated(req, res, next) {
    console.log("isAuthenticated");
    if (req.isAuthenticated()) { return next(); }
    return next("NotAuth");
};