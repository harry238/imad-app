var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var config = {
    user: 'hardikrathod62',
    database: 'hardikrathod62',
    host: 'db.imad.hasura-app.io',
    port: '5432',
    password: process.env.DB_PASSWORD
}
var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30}
}));

function createTemplate(data) {
    
    var title = data.title;
    var heading = data.heading;
    var date = data.date;
    var content = data.content;
    var htmlTemplate = 
    `<html>
        <head>
            <title>
                ${title}
            </title>
            <meta name = "viewport" content = "width=device-width, initial-scale=1" />
            <link href="/ui/style.css" rel="stylesheet" />
        </head>
        <body>
            <div class="container">
                <div>
                   <a href="/">Home</a> 
                </div>
                <hr/>
                <h3>
                    ${heading}
                </h3>
                <div>
                    ${date.toDateString()}
                </div>
                <div>
                   ${content}
                </div>
                <hr/>
                <h4>Comments</hr>
                <div id ="comment_form">
                </div>
                <div id ="comments">
                    <center>Loading comments...</center>
                </div>
            </div>
          <script type="text/javascript" src="/ui/article.js">
          </script>
        </body>
    </html>`;
    return htmlTemplate;
    
}

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});


function hash(input, salt){
    //How do we create a hash?
    var hashed =crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
    return ["pbkdf2", "10000", salt, hashed.toString('hex')].join('$');
}


app.get('/hash/:input',function(req, res){
    var hashedString = hash(req.params.input, 'this-is-salt-random-string');
    res.send(hashedString);
});


app.post('/create-user', function(req,res){
    //username, password
    //JSON
    var username = req.body.username;
    var password = req.body.password;
    
    var salt = crypto.randomBytes(128).toString('hex');
    var dbString = hash(password,salt);
    pool.query('INSERT INTO "user"(username,password) VALUES ($1,$2)', [username,dbString], function(err,result){
        if(err) {
            res.status(500).send(err.toString());
        } else{
            res.send('User successfully Created: ' + username);
        }
    });
});


app.post('/login', function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    
    pool.query('SELECT * FROM "user" WHERE username = $1', [username], function(err,result){
        if(err) {
            res.status(500).send(err.toString());
        } else{
            if(result.rows.length === 0){
                res.status(403).send('username/password is invalid');
            } else {
                //MAtch the password
                var dbString = result.rows[0].password;
                var salt = dbString.split('$')[2];
                var hashedPassword = hash(password, salt); //creating a hash based on password submitted and the original salt
                
                if(hashedPassword === dbString){
                    
                                        //set a session

                    req.session.auth = {userId: result.rows[0].id};
                    //set cookie with a session id
                    //internally, on the server side, it maps the session id to an object
                    //{auth: {userId }}
                    res.send('Credentials Correct!');
                } else{
                     res.status(403).send('username/password is invalid');
                }
            }
        }
    });
});


app.get('/check-login', function (req,res) {
    if (req.session && req.session.auth && req.session.auth.userId) {
        //Load the user object
        pool.query('SELECT * FROM "user" WHERE id = $1', [req.session.auth.userId], function(err,result){
            if(err){
                res.status(500).send(err.toString());
            } else{
                res.send(result.rows[0].username);
            }
        });
    } else {
        res.status(400).send('You are not logged in');
    }
});

app.get('/logout', function(req,res){
    delete req.session.auth;
    res.send('<html><body>Logged out!</br></br><a href ="/">Back to Home</a></body></html>');
});

var pool = new Pool(config);
app.get('/get-articles',function(req,res){
    // make a select request
    
    // return a response with the results
    pool.query('SELECT * FROM article ORDER BY date DESC', function(err,result){
        if(err) {
            res.status(500).send(err.toString());
        } else{
            res.send(JSON.stringify(result.rows));
        }
    });
});


app.get('/get-comments',function(req,res){
    // make a select request
    
    // return a response with the results
    pool.query('SELECT comment.*,"user".username FROM article, comment, "user" WHERE article.title =$1 AND article.id = comment.article_id', function(err,result){
        if(err) {
            res.status(500).send(err.toString());
        } else{
            res.send(JSON.stringify(result.rows));
        }
    });
});

app.post('/submit-comment/:articleName',function(req, res){
    //Check if the user is logged in
    if(req.session && req.session.auth && req.session.auth.userId){
        //First check if the article exits and get the article-id
        pool.query('SELECT *from article WHERE title = $1', [req.params.articleName], function(err,result) {
            if(err){
                res.status(500).send(err.toString());
            } else{
                if(result.rows.length === 0){
                    res.status.send('Article not found');
                } else {
                    var articleId = result.rows[0].id;
                    //Now insert the right comment for this article
                    pool.query("INSERT INTO comment (comment, article_id,user_id) VALUES ($1,$2,$3)",[req,body.comment, articleId, req.session.auth.userId],function(err,result){
                        if(err){
                            res.status(500).send(err.toString());
                        } else{
                            res.status(200).send('Comment Inserted!');
                        }
                    });
                }
            }
        });
    } else{
        res.status(403).send('Only logged in users can comment');
    }
});

app.get('/articles/:articleName', function(req,res){
    //articleName == article-one
    //articles[articleName] ={} content of article-one
    
    pool.query("SELECT * FROM article WHERE title = $1", [req.params.articleName], function (err,result){
        if(err){
            res.status(500).send(err.toString());
        } else{
            if(result.rows.length === 0){
                res.status(404).send('Article not found');
            } else {
                var articleData = result.rows[0];
                res.send(createTemplate(articleData));
            }
        }
    });
   
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/favicon.ico', function (req, res) {

res.sendFile(path.join(__dirname, 'ui', 'favicon.ico'));

});

app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});


app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});


// Do not change port, otherwise your app won't run on IMAD  
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(80, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
