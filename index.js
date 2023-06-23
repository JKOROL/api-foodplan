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

app.get('/user', (req,res)=>{
    database.query("SELECT username,mail,avatar FROM userAccount", (error, result) => {
        if(error) throw Error(error.message);
        res.status(200).json(result);
    });
});

app.get('/user/:id', (req,res)=>{
    const id = parseInt(req.params.id);
    database.execute("SELECT * FROM userAccount WHERE idUser = ?",[id],(error, result) => {
        if(error) throw Error(error.message);
        if(result[0])
        {
            res.status(200).json(result);
        }
        else{
            res.status(401).json({status:"error",message:"User not found"})
        }
    });
});

app.post('/user', (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const salt = (Math.random() + 1).toString(36).substring(7);
    database.execute("INSERT INTO userAccount(email,passHash,salt,username,idQuestion,answer) VALUES (?,?,?,?,?,?)",[email,sha1(password+salt),salt,username,1,"ee"], (error, result) => {
        if(error)
        {
            console.log(error.message);
            res.status(500).send();
        }
        else{
            res.status(200).json({status:"succes",message:"Inscription réussie"});
        }
    });
});

app.post('/login', (req,res)=>{
    try{
        const mail = req.body.mail;
        const password = req.body.password;
        const stayConnected = req.body.stayConnected;
        let duration = stayConnected ? config.settings.defaultDurationTokenStayConnected : config.settings.defaultDurationToken;
        let salt = "";
        let user = {};
        database.query("SELECT passHash FROM userAccount WHERE mail = '"+mail+"'", (error, result) => {
        if(error){
            console.log(error.message);
            res.status(500).send();
        }
        else{
            if(result.length==0)
            {
                console.log("Email non reconnu");
                res.status(401).send();
            }
            else{
                salt = result[0].passHash;
                database.query("SELECT id, username FROM userAccount WHERE mail = '"+mail+"' AND password = '"+sha1(password+salt)+"'", (error, result) => {
                    if(error)
                    {
                        console.log(error.message);
                        res.status(500).send();
                    }
                    else if(result.length==0)
                    {
                        console.log('Mot de passe incorrect');
                        res.status(401).send();
                    }
                    else{
                        user = result[0];
                        token = jwt.sign({ 
                                'exp': Math.floor(Date.now() / 1000) + (60 * duration),
                                'data': user 
                        }, config.settings.privateKey);
                        let json = {
                            'token' : token,
                            'id' : user.id,
                            'username' : user.username 
                        };
                        res.status(200).json(json);
                    }
                });
            }
        }
    });
    }
    catch(error)
    {
        console.log(error.message);
        res.status(500).send();
    }
    
});

app.post('/verifyToken', (req,res)=>{
    try {
        const token = req.body.token;
        let clearToken = jwt.verify(token,config.settings.privateKey);
        res.status(200).json({"id": clearToken.data.id,"username": clearToken.data.username})
    } catch (error) {
        console.log(error.message);
        res.status(401).send();
    }
        
})

app.listen(config.settings.port, () => {console.log("Serveur à l'écoute")});