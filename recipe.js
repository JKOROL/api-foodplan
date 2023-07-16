module.exports = function(app){
app.post("/recipe",(req,res)=>{
    var recipe = req.body.recipe;
    if(recipe){
        database.execute("INSERT INTO recipe(label,idUser) VALUES (?,?)",[recipe.label,recipe.idUser],(error,result)=>{
            if(error){
                console.log(error.message);
                res.status(500).send();
            }else{
                var recipeId = result.insertId;
                recipe.instructions.forEach(instruction => {
                    database.execute("INSERT INTO instruction(content,idRecipe) VALUES (?,?)",[instruction.content,recipeId],(error,result)=>{
                        if(error){
                            console.log(error);
                        }
                    })
                });
                recipe.ingredients.forEach(ingredients => {
                    database.execute("INSERT INTO have(idRecipe,idIngredient,quantity,unit) VALUES (?,?)",[recipeId,ingredients.ingredient.idIngredient,ingredients.quantity,ingredients.unit],(error,result)=>{
                        if(error){
                            console.log(error);
                        }
                    })
                });
            }
        })
        res.status(200).json({status:"succes",idRecipe:idRecipe,message:"Recette créer, redirection..."});
    }
})

    app.put("/recipe",(req,res)=>{
        //TODO
    })
}