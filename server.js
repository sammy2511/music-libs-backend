let express = require('express')
let request = require('request')
let querystring = require('querystring')
const hbs = require('hbs');
const fs = require('fs');
let app = express()
hbs.registerPartials(__dirname+'/views');
app.set('view engine','hbs');


let redirect_uri =
  process.env.REDIRECT_URI ||
  'http://localhost:8888/callback/'

  app.use((req,res,next) => {
  var now = new Date().toString();
  var log = `${now} : ${req.method} : ${req.url}`;

  fs.appendFile('server.log',log + '\n',(error) => {
    if (error) {
      console.log('Unable to append in server.log');
    }
  });
next();
});

app.get('/',(req,res) => {
  res.render('home.hbs',{
    pageTitle:'Home Page',
    welcomeMessage:'Welcome to Music Libs'
  });
});

app.get('/login', function(req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email',
      redirect_uri
    }))
})

app.get('/callback', function(req, res) {
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000'
    console.log(uri);
    res.redirect(uri + '?access_token=' + access_token)
  })
})

let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
app.listen(port)
