const http = require('http');  // 'http' module
const hostname = '127.0.0.1';  // ip for localhost
var port = process.env.PORT || 3000,
    fs = require('fs'),
    html = fs.readFileSync('index.html');


const express = require('express');  // include the "express" module
const app = express();
app.use(express.static(`${__dirname}`));

// Define route for get request at '/'
app.get('/',(req,res) =>{
	res.status(200);
	res.sendFile(path.join(__dirname,"index.html"));
});

// Define the static resource (HTML/CSS/JS/images)
app.use(express.static('public'));             // URL '/' (root) maps to 'public' directory
app.use('/static', express.static('public'));  // URL '/static' also maps to 'public' directory

app.listen(port, () => console.log(`Server listening at port ${port}...`));


 

 /* 
// app.js
const express = require('express');  // include the "express" module
const app = express();
const port = process.env.PORT || 3000;


// Define route for get request at '/'
app.get('/', (req, res) => res.send('hello, express world'));
// Define the static resource (HTML/CSS/JS/images)
app.use(express.static('public'));             // URL '/' (root) maps to 'public' directory
app.use('/static', express.static('public'));  // URL '/static' also maps to 'public' directory

app.listen(port, () => console.log(`Server listening at port ${port}...`)); */