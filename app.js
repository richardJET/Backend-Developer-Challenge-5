const http = require('http');
const mysql = require('mysql2');
const cookieSession = require('cookie-session')
const cors = require('cors')


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'auth',
    password: '',
});

const sessionMiddleware = cookieSession({
    name: 'session', 
    keys: ['7d5#1fGh@kL$3PzQ!2vW*xZ8&yTnN'], 
    maxAge: 24 * 60 * 60 * 1000, 
});

const corsMiddleware = cors({
    origin: 'http://localhost',
    methods: 'GET',
    optionsSuccessStatus: 200,
    credentials: true,
});


const server = http.createServer((req, res) => {
    corsMiddleware(req, res, () => {
        sessionMiddleware(req, res, () => {
            if (req.url === '/register') {
                let body = '';

                req.on('data', (dataChunk) => {
                    body += dataChunk.toString();
                });

                req.on('end', () => {
                    const formData = new URLSearchParams(body);
                    const displayName = formData.get('displayName');
                    const email = formData.get('email');
                    const password = formData.get('password');

                    db.query('INSERT INTO users (displayName, email, password) VALUES (?, ?, ?)', [displayName, email, password], (error) => {
                        if (error) {
                            console.error("MySQL Error:", error.message);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error registering user. MySQL Error: ' + error.message)
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('User registered successfully');
                        }
                    });

                    req.session.email = email;
                    res.writeHead(302, {
                        'Location': 'http://localhost/BDC2/profile.html',
                        'Content-Type': 'application/json',
                    });
                    res.end();
                });
            }
            else if (req.url === '/login') {
                let body = '';

                req.on('data', (dataChunk) => {
                    body += dataChunk.toString();
                });

                req.on('end', () => {
                    const formData = new URLSearchParams(body);
                    const email = formData.get('email');
                    const password = formData.get('password');
            
                    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
                        if (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error logging in');
                        } else if (results.length === 0) {
                        res.writeHead(401, { 'Content-Type': 'text/plain' });
                        res.end('User not found');
                        } else {
                            if (password === results[0].password) {
                                req.session.email = results[0].email;
                                res.writeHead(302, {
                                    'Location': 'http://localhost/BDC2/profile.html',
                                    'Content-Type': 'application/json',
                                });
                                res.end();
                                
                        } else {
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('Incorrect password');
                        }
                    }});            
                });
            }
            else if (req.url === '/setProfile') {
                let body = '';

                req.on('data', (dataChunk) => {
                    body += dataChunk.toString();
                });

                req.on('end', () => {
                    const formData = new URLSearchParams(body);
                    const email = formData.get('email');
                    const newProfileImage = formData.get('newProfileImage');
                    const newDescription = formData.get('newDescription');
                    

                    db.query('UPDATE users SET profile_photo = ?, description = ? WHERE email = ?', [newProfileImage, newDescription, email], (error) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error updating profile. MySQL Error: ' + error.message)
                        } else {
                            res.writeHead(302, {
                                'Location': 'http://localhost/BDC2/profile.html',
                                'Content-Type': 'application/json',
                            });
                            res.end();
                        }
                    });
                });
            } 
            else if (req.url === '/getProfile') {

                const email = req.session.email;
                    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error fetching profile data');
                        } else if (results.length === 0) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('User not found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(results[0]));
                        }
                    });
            } else {
                res.statusCode = 404;
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            }
        });
    });
});

const port = 3001;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});