import mongoose from 'mongoose';
const userschema = new mongoose.Schema(
    {
        name:{
            type :string ,
            required :true,
            trim :true,
        },
        email:{
            type :string ,
            required :true,
            trim :true,
            unique :true,
        },
        password:{
            type :string ,
            required :true,
            trim :true,

        }
    }
)
const User = mongoose.model('User',userschema);
export default User;
