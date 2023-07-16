module.exports = function(app){
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

}