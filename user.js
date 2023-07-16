module.exports = function(app){
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
    database.query("SELECT username,email,avatar FROM userAccount", (error, result) => {
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

}