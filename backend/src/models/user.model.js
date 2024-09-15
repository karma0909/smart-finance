import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new  mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
        index : true,
    },
    password : {
        type : String,
        required : [true,'Password is Required'],
    },
    refreshToken : {
        type : String,
    },
},
{
    timestamps : true,
})

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next();
})

// to verify password with hash password in db
userSchema.methods.isPasswordCorrect = async function (password) 
{
    return await bcrypt.compare(password,this.password)
}

// Generate Access Token

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id : this._id,
        username : this.username,
        email : this.email,
        fullname : this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
    })
}

// Generate Refresh Token

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
    })
}

const User = mongoose.model("User",userSchema)

export default User;