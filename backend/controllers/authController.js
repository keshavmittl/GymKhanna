import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const signup = async(req,res)=>{
    try{
        //if one of the field is empty
        const{name,email,password} = req.body;
        if (!name || !email || !password) {
        return res.status(400).json({
        success: false,
        data: null,
        message: 'Name, email and password are required',
        });
    }
        //check if email already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
            success: false,
            data: null,
            message: 'Email already exists',
            });
        }
        //hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        //create user
        const user = await User.create({
        name,
        email,
        password: hashedPassword,
        });
        //generate token
        const token = jwt.sign(
        { userId: user._id },
         process.env.JWT_SECRET,
        { expiresIn: '7d' });

        res.status(201).json({
        success: true,
        data: {
            token,
            user: { id: user._id, name: user.name, email: user.email },
        },
        message: 'Account created successfully',
        });
        }
    catch(err){
        res.status(500).json({success :false,data :null,message :err.message});
    }
}
export const login = async(req,res)=>{
    try{
        const {email,password} = req.body;
        //check if email and password are empty
        if(!email || !password){
            return res.status(400).json({
            success: false,
            data: null,
            message: 'Email and password are required',
            });
        }
        //find user check if there is same email registered
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
            success: false,
            data: null,
            message: 'Invalid email or password',
            });
        }
        //if there is an same email check if the hash of the password matches with the password stored in the database
        //we didnt provide salt because we are using bcryptjs , bycryptjs stores the (salt,round , hashed password )in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(401).json({
            success: false,
            data: null,
            message: 'Invalid email or password',
        });
        }
        //if yes , the ncreate a jwt token and send it to the client as a response

        const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
        );
        //send the success response to the frontend 
        res.status(200).json({
        success: true,
        data: {
            token,
            user: { id: user._id, name: user.name, email: user.email },
        },
        message: 'Login successful',
        });


    }
    catch(err){
        res.status(500).json({sucess:false , data : null , message : err.message});
    }
}
