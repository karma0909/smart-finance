import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'

const port = process.env.PORT || 7002;

dotenv.config({
    path: './env'
});

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Server Error : ",error);
        throw error
    })
    app.listen(port,()=>{
        console.log(`Server is running at port : ${port}`);
    })
})
.catch((error)=>{
    console.log("MongoDB Connection Failed !!!!! ",error);
})