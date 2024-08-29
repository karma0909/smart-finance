// import express from 'express';
import dotenv from "dotenv";
import connectDB from "./db/index.js"

// const app = express();

dotenv.config({
    path: './env'
});

connectDB();

/* app.get("/",(req,res)=>{
    res.send("Server is Ready");
});

const port = process.env.PORT || 7002;

app.listen(port,()=>{
    console.log(`Server is running on  http://localhost:${port}`);
}); */