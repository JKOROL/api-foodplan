module.exports = function(app){

app.get("/ingredient",(req,res)=>{
    database.execute("SELECT * FROM ingredient",(error,result)=>{
        if(error){
            console.log(error.message);
            res.status(500).send();
        }
        else{
            res.status(200).json(result);
        }
    })
})

app.post("/ingredient",(req,res)=>{
    database.execute("INSERT INTO ingredient(label) VALUES (?)",[req.body.ingredient],(error,result)=>{
        if(error){
            console.log(error.message);
            res.status(500).send();
        }else{
            res.status(200).json({id:result.insertId,label:req.body.ingredient});
        }
    })
})

}