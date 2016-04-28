module.exports = function provideHttp(res, err, result) {
    if( err ) {
        return res.status("404").json(err);
    }
    return res.json(result);
};