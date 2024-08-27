import express from 'express';

const app = express();

app.get("/",(req,res)=>{
    res.send("Server is Ready");
});

const port = process.env.PORT || 7002;

app.listen(port,()=>{
    console.log(`Server is running on  http://localhost:${port}`);
});