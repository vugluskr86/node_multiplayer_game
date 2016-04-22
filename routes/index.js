module.exports = function(app, passport) {

  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // facebook -------------------------------

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // facebook -------------------------------

  // send to facebook to do the authentication
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
      passport.authenticate('facebook', {
        successRedirect : '/',
        failureRedirect : '/'
      }));

  // twitter --------------------------------

  // send to twitter to do the authentication
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

  // handle the callback after twitter has authenticated the user
  app.get('/auth/twitter/callback',
      passport.authenticate('twitter', {
        successRedirect : '/',
        failureRedirect : '/'
      }));


  // google ---------------------------------

  // send to google to do the authentication
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
      passport.authenticate('google', {
        successRedirect : '/',
        failureRedirect : '/'
      }));
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}