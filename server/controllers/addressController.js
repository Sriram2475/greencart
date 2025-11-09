import Address from "../models/Address.js";

// Add address : /api/address/add

export const addAddress=async (req,res) => {
    try {
        // const {userId,address}=req.body;
        const { address } = req.body;
        const userId = req.userId; // ✅ get from middleware
        await Address.create({...address,userId});
        res.json({success:true,message:"Address added successfully"});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}

// Get address : /api/address/add

export const getAddress=async (req,res) => {
    try {
        // const {userId}=req.body;
        const userId = req.userId; // ✅ from middleware
        const addresses = await Address.find({userId});
        res.json({success:true,addresses});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}