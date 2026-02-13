const express = require('express');

require('dotenv').config({path:'variables.env'})

const app = express();

 app.get('/',(req,res) =>{
     res.send('servidor funcionando')
 }) 

app.listen(process.env.PORT, () => {
  console.log('servidor corriendo');
})
