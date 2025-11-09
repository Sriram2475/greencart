import jwt from "jsonwebtoken"; 

//next will execute the controller function
const authUser=async(req,res,next)=>{
    const {token}=req.cookies;
// console.log("Auth middleware token:", token);

    if(!token){
        return res.json({success:false,message:'Not Authorized'});
    }

    try {
        const tokenDecode=jwt.verify(token,process.env.JWT_SECRET);
        if(tokenDecode.id){
            // req.body.userId=tokenDecode.id;
            req.userId=tokenDecode.id;
        }
        else{
            return res.json({success:false,message:'Not Authorized'});
        }
    next();
    } catch (error) {
        res.json({success:false,message:error.message});
    }
}

export default authUser;