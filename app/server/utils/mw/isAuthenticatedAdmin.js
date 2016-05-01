module.exports = function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === "admin" ) { return next(); }
    return next("NotAuth");
};

