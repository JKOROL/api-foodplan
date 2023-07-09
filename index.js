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

app.get('/checkUser/:username', (req,res)=>{
    const username = req.params.username;
    database.execute("SELECT * FROM userAccount WHERE username = ?",[username],(error, result) => {
        if(error) throw Error(error.message);
        if(result[0])
        {
            res.status(200).json({status:"failed",message:"Nom d'utilisateur non disponible"});
        }
        else{
            res.status(200).json({status:"succes",message:"Username disponible"})
        }
    });
});

app.get('/checkEmail/:email', (req,res)=>{
    const email = req.params.email;
    console.log(email);
    database.execute("SELECT * FROM userAccount WHERE email = ?",[email],(error, result) => {
        if(error) throw Error(error.message);
        if(result[0])
        {
            res.status(200).json({status:"failed",message:"Utilisateur déjà inscrit avec cette adresse !"});
        }
        else{
            res.status(200).json({status:"succes",message:"Email non enregistré."})
        }
    });
});

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

app.put("/user",(req,res)=>{
    const email = req.body.email;
    const username = req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const idUser = req.body.idUser;
    database.execute("SELECT idUser from userAccount WHERE username = ? AND idUser NOT IN (SELECT idUser from userAccount WHERE idUser = ? and username = ?)",[username,idUser,username], (error, result) => {
        if(error)
        {
            console.log(error.message);
            res.status(500).send();
        }
        else{
            if(result.length!==0)
            {
                console.log("username");
                res.status(200).json({status:"failed",message:"Ce pseudo n'est pas disponible."});
            }
            else{
                database.execute("SELECT idUser from userAccount WHERE email = ? AND idUser NOT IN (SELECT idUser from userAccount WHERE idUser = ? and email = ?)",[email,idUser,username], (error, result) => {
                    if(error)
                    {
                        console.log(error.message);
                        res.status(500).send();
                    }
                    else{
                        if(result.length!==0)
                        {
                            res.status(200).json({status:"failed",message:"Une erreur est survenue.\nContactez les administrateurs."});
                        }
                        else{
                            database.execute("UPDATE userAccount SET email = ? , username = ? , firstName = ? , lastName = ? WHERE idUser = ?",[email,username,firstName,lastName,idUser], (error, result) => {
                                if(error)
                                {
                                    console.log(error.message);
                                    res.status(500).send();
                                }
                                else{
                                    res.status(200).json({status:"succes",message:"Modifications enregistrées."});
                                }
                            });
                        }
                    }
                });
            }
        }
    });
})

app.post('/user', (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const salt = (Math.random() + 1).toString(36).substring(7);
    database.execute("INSERT INTO userAccount(email,passHash,salt,username,firstName,lastName) VALUES (?,?,?,?,?,?)",[email,sha1(password+salt),salt,username,firstName,lastName], (error, result) => {
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
        const email = req.body.email;
        const password = req.body.password;
        const stayConnected = req.body.stayConnected;
        let duration = stayConnected ? config.settings.defaultDurationTokenStayConnected : config.settings.defaultDurationToken;
        let salt = "";
        let user = {};
        database.query("SELECT salt FROM userAccount WHERE email = '"+email+"'", (error, result) => {
        if(error){
            console.log(error.message);
            res.status(500).send();
        }
        else{
            if(result.length==0)
            {
                console.log("Email non reconnu");
                res.status(200).json({status:"failed",message:"Identifiant et/ou mot de passe incorrect !"});
            }
            else{
                salt = result[0].salt;
                database.query("SELECT idUser, email, firstName, lastName, username, avatar FROM userAccount WHERE email = '"+email+"' AND passhash = '"+sha1(password+salt)+"'", (error, result) => {
                    if(error)
                    {
                        console.log(error.message);
                        res.status(500).send();
                    }
                    else if(result.length==0)
                    {
                        console.log('Mot de passe incorrect');
                        res.status(200).json({status:"failed",message:"Identifiant et/ou mot de passe incorrect !"});
                    }
                    else{
                        user = result[0];
                        token = jwt.sign({ 
                                'exp': Math.floor(Date.now() / 1000) + (60 * duration),
                                'data': user 
                        }, config.settings.privateKey);
                        let json = {
                            'status' : "succes",
                            'message' : "Bienvenue "+user.username,
                            'token' : token,
                            'user' : user
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

app.put('/changePassword', (req,res)=>{
    try{
        const idUser = req.body.idUser;
        const password = req.body.password;
        const newPassword = req.body.newPassword;
        console.log(password);
        let salt = "";
        database.execute("SELECT salt FROM userAccount WHERE idUser = ?",[idUser], (error, result) => {
        if(error){
            console.log(error.message);
            res.status(500).send();
        }
        else{
            if(result.length==0)
            {
                console.log("Email non reconnu");
                res.status(200).json({status:"failed",message:"Identifiant et/ou mot de passe incorrect !"});
            }
            else{
                salt = result[0].salt;
                console.log(password,salt)
                console.log(sha1(password+salt));
                database.execute("SELECT idUser FROM userAccount WHERE idUser = ? AND passhash = ?",[idUser,sha1(password+salt)], (error, result) => {
                    if(error)
                    {
                        console.log(error.message);
                        res.status(500).send();
                    }
                    else if(result.length==0)
                    {
                        console.log('Mot de passe incorrect');
                        res.status(200).json({status:"failed",message:"Mot de passe incorrect !"});
                    }
                    else{
                        const newSalt = (Math.random() + 1).toString(36).substring(7);

                        database.execute("UPDATE userAccount SET passhash = ? , salt = ? WHERE idUser = ?",[sha1(newPassword+newSalt),newSalt,idUser], (error, result) => {
                            if(error)
                            {
                                console.log(error.message);
                                res.status(500).send();
                            }
                            else{
                                res.status(200).json({status:"succes",message:"Mot de passe changé !"});
                            }
                        });
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
        console.log(clearToken.data);
        res.status(200).json({'status':"valid",'user':clearToken.data,'test':'test'})
    } catch (error) {
        console.log(error.message);
        res.status(401).send();
    }
        
})

app.listen(config.settings.port, () => {console.log("Serveur à l'écoute")});