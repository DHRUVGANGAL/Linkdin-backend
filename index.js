const express =require("express")
const app=express();
require('dotenv').config();
const Port=process.env.PORT
app.listen(Port,()=>{
    console.log(Port);
});