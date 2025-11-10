import User from "../models/User.js";


// Update User CartData : /api/cart/update

export const updateCart=async (req,res) => {
    try {
        // const {userId,cartItems}=req.body;
        const { cartItems } = req.body;
        const userId = req.userId; //  userId comes from middlewa
        await User.findByIdAndUpdate(userId,{cartItems});
        res.json({success:true,message:"Cart Updated"});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}