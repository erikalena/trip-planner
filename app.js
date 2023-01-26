const http = require('https');  // 'http' module
var port = process.env.PORT || 3000,
    fs = require('fs'),
    html = fs.readFileSync('index.html');


const express = require('express');  // include the "express" module
const bodyParser = require('body-parser');
const path = require('path');
const { table } = require('console');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.static(`${__dirname}`));
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());



// Define route for get request at '/'
app.get('/',(req,res) =>{
	res.status(200);
	res.sendFile(path.join(__dirname,"index.html"));
});

// Define the static resource (HTML/CSS/JS/images)
app.use(express.static('public'));             // URL '/' (root) maps to 'public' directory
app.use('/static', express.static('public'));  // URL '/static' also maps to 'public' directory

app.listen(port, () => console.log(`Server listening at port ${port}...`));


//route to get data from tables
app.get('/visitTables/:user', (req,res) =>{
    let user = req.params.user;
    let db = openDatabase(res);
	 db.all(`select TRIP.id as Trip, CITY.label as City, POI.type as Attraction, VISITS.day as Day
         from VISITS 
         join TRIP on TRIP.id = VISITS.tripId join POI on POI.id = VISITS.poiId
         join CITY on CITY.id = TRIP.city
         where TRIP.user = '${user}'
         order by TRIP.id, VISITS.day  `,
		(err, rows) => return_rows(res, err, rows))  
});


//route to insert data into tables
app.post('/saveTrip', (req,res) =>{
	let content = req.body.content;
    insertTrip(content, res);
    res.status(200).send('Trip saved');
});

function return_rows(res, err, rows){
    if (err) {
        console.log(err);
        res.status(500).send('Error reading database');
    }
    else{
        res.status(200).send(rows);
    }
}

function openDatabase(res){
    //open or create the db file
    
    let db = new sqlite3.Database(path.join(__dirname,'db/database.db'),(err) => {
        if (err) {
            console.log(err,__dirname);
            res.status(500).send('Error connecting to database');
        }
        else{
            
            // if db is empty, create tables
            db.exec(`CREATE TABLE IF NOT EXISTS TRIP (
                    id int not null, 
                    user int not null, 
                    ndays int not null, 
                    city int not null,
                    PRIMARY KEY (ID),
                    FOREIGN KEY (city) REFERENCES city(id)
                ); 
                CREATE TABLE IF NOT EXISTS CITY (
                    id int not null, 
                    label varchar(255),
                    PRIMARY KEY (ID)
                ); 
                CREATE TABLE IF NOT EXISTS POI (
                    id int not null, 
                    type varchar(255),
                    label varchar(255),
                    PRIMARY KEY (ID)
                ); 
                CREATE TABLE IF NOT EXISTS VISITS (
                    tripId int not null, 
                    poiId int not null,
                    day int not null,
                    PRIMARY KEY (tripId, poiId),
                    FOREIGN KEY (tripId) REFERENCES trip(id),
                    FOREIGN KEY (poiId) REFERENCES poi(id)
                ); 
                `, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
        } 
    });
    return db;
}

function check_rows(err, rows) {
	if(err) 
		console.log(err);
    console.log(rows);
}

function read_data(db, res){
    
    let tables = ['TRIP', 'CITY', 'POI', 'VISITS'];

    console.log('Read data from database');
    db.all(`select * from ${tables[0]}`,
		(err, rows) => check_rows( err, rows));
    
    db.all(`select * from ${tables[1]}`,
		(err, rows) => check_rows( err, rows));

    db.all(`select * from ${tables[2]}`,
		(err, rows) => check_rows( err, rows));

    db.all(`select * from ${tables[3]}`,
		(err, rows) => check_rows( err, rows));

}


function closeDatabase(db, res){
    db.close((err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error connecting to database');
        }
        else{
            console.log('Close the database connection.');
        }
    });
}


function insertTrip(content,res) {
    let db = openDatabase(res);
    read_data(db, res);

    let days = content.days;
    let user = content.logged_user;
    let cityCode = content.cityCode;
    let cityLabel = content.cityLabel;

    // insert into db in trip table, new trip
    // before get sequential id of last trip inserted
    let last = 1;
    let query = '';

    // check if city exists
    db.serialize(function () {
        
        db.all(`select * from CITY where id = '${cityCode}'`, (err, row) => {
                if(err){
                    console.log(err);
                    return;
                }
                else{
                    if (row && row.length ){
                        console.log('city already exists');
                    }
                    else {
                        // insert city in city table if not exists
                        db.exec(`INSERT INTO CITY (id, label)
                        VALUES('${cityCode}',"${cityLabel}");`);
                        console.log('city inserted');

                    }
                        
                }
            }
        );

        // insert returned poi 
        content.places.forEach(poi => {

            let idx = poi.item.value.lastIndexOf("/");
            let id = poi.item.value.slice(idx+1);

            //check if poi exists
            db.all(`select * from POI where id = '${id}'`, (err, row) => {
                    if(err){
                        console.log(err);
                        return;
                    }
                    else{
                        if (row && row.length ){
                            console.log('poi already exists');
                        }
                        else {
                            // insert poi in poi table if not exists
                            let name = poi.itemLabel.value.replace(/'/g, " ");
                            db.exec(`INSERT INTO POI (id, type, label)
                            VALUES('${id}','${name}','${poi.label.value}');`, (err) => {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                            });
                        }
                            
                    }
                }
            );
        });
        
        db.all(`
            select max(id) as max 
            from TRIP
            `, (err, rows) => {
                if(err){
                    console.log(err);
                    return;
                }
                else{
                    if (rows && rows.length)
                        last = rows[0].max + 1;
                    
                    db.exec(`INSERT INTO TRIP (id, user, ndays, city)
                    VALUES('${last}','${user}','${days}','${cityCode}');`, (err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        else {
                            console.log('trip inserted');
                            // insert each poi in visits table
                            // which link each poi to a day of the trip
                            content.places.forEach(poi => {
                                let idx = poi.item.value.lastIndexOf("/");
                                let id = poi.item.value.slice(idx+1);

                                db.exec(`INSERT INTO VISITS (tripId, poiId, day)
                                VALUES('${last}', '${id}', '${poi.day}');`, (err) => {
                                    if(!err) 
                                        console.log('visit inserted');
                                    
                                 }) ;

                            });
                            read_data(db, res);
                        }
                    });

                }
        });
    
    });
   
   
}

