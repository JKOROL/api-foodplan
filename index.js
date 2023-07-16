//importations
const express = require('express');
const mysql = require('mysql2');
const sha1 = require('js-sha1');
const jwt = require('jsonwebtoken');
const config = require('./config.json');
const cors = require('cors');


const app = express();

app.use(cors({
    origin: config.settings.acceptedDomains,
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));
app.use(express.json())

var database = mysql.createConnection(config.bdd);

database.connect((error)=>{
    if(error)
    {
        console.log('Problème de connexion à la BD : '+error);
    }
    else
    {
        console.log('Connexion à la BDD : OK.');
    }
});

app.use(express.json());

require("./auth.js")(app);
require("./ingredient.js")(app);
require("./recipe.js")(app);
require("./user.js")(app);

app.listen(config.settings.port, () => {console.log("Serveur à l'écoute")});