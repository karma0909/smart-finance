import { asyncHandler } from "../utils/asyncHandler.js";
import validator from 'validator';
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    
    const {fullname,username,email,password} = req.body
    
    // Validation of all Empty and Undefined fields
    if (!fullname || !username || !email || !password)
    {
        throw new ApiError(400,"All fields are required")
    }

    // validation of fullname
    if(!validator.isAlpha(fullname))
    {
        throw new ApiError(400,"Fullname must be Alphabets only")
    }

    // Validation of email
    if(!validator.isEmail(email))
    {
        throw new ApiError(400,"Invalid email format")
    }

    // Validation of username
    if(!validator.isAlphanumeric(username))
    {
        throw new ApiError(400,"Invalid Username must be alphanumeric")
    }


    // checking if user already exists
    const existingUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    if(existingUser)
    {
        throw new ApiError(409,"User with email or username already exists")
    }

    // creating new user
    const newUser = await User.create({
        fullname,
        username : username.toLowerCase(),
        email,
        password,
    })

    // checking if user created successfully
    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went  wrong in registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})

export { registerUser }