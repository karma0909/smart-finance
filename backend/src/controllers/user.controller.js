import { asyncHandler } from "../utils/asyncHandler.js";
import validator from 'validator';
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => 
{
    try
    {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })

        return {accessToken, refreshToken}
    }

    catch(error)
    {
        throw new ApiError(500,"Error while generating access and refresh tokens")   
    }
}

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

const loginUser = asyncHandler( async (req,res) => {
    
    const {username,email,password} = req.body

    // username or email
    if(!(username || email))
    {
        throw new ApiError(400,"username or email is required")
    }

    // finding user if exists
    const user = await User.findOne({
        $or : [{ username },{ email }]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    // checking password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid User credentials")
    }

    // generating Tokens of Valid User
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // disable cookie changes from frontend
    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new : true,
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logged Out Successfully"
        )
    )
})

const refreshAccessToken = asyncHandler(async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token not found")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user: accessToken,
                    refreshToken
                },
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
 }