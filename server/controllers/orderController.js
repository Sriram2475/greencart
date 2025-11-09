import Order from "../models/Order.js";
import User from "../models/User.js";

import Product from "../models/Product.js";
import stripe from "stripe";



// Place Order Stripe : /api/order/stripe

export const placeOrderStripe=async (req,res) => {
       try {
        // const {userId,items,address}=req.body;
        const { items, address } = req.body;
        const userId = req.userId; // ✅ from middleware
        const {origin}=req.headers;

        if(!address || items.length===0){
            return res.json({success:false,message:"Invalid data"})
        }

        let productData=[];
        // Calculate Amount Using Items
        let amount=await items.reduce(async (acc,item) => {
            const product=await Product.findById(item.product);
            productData.push({
                name:product.name,
                price:product.offerPrice,
                quantity:item.quantity
            })
            return (await acc)+product.offerPrice * item.quantity;
        },0) // Initial acc value 0

        // Add Tax Charge (2%)
        amount+=Math.floor(amount*0.02);
        const order=await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType:"Online",
        })

        // Stripe Gateway Initialize
        const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY);

        // Create line items for stripe
        const line_items=productData.map((item)=>{
            return{
                price_data:{
                    currency:"usd",
                    product_data:{
                       name: item.name,
                    },
                    unit_amount:Math.floor(item.price + item.price*0.02)*100
                },
                quantity:item.quantity,
            }
        })

        // Create session
        const session=await stripeInstance.checkout.sessions.create({
            line_items,
            mode:"payment",
            success_url:`${origin}/loader?next=my-orders`,
            cancel_url:`${origin}/cart`,
            metadata:{
                orderId:order._id.toString(),
                userId,
            }
        })

        return res.json({success:true,url:session.url});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}


// Stripe Webhooks to Verify Payments Action :/stripe

export const stripeWebhooks=async (req,res) => {
    //Stripe Gateway Initialize
    const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY);

    const sig= req.headers["stripe-signature"];
    let event;
    try {
        event=stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.log("❌ Webhook signature verification failed:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`); 
    }

    console.log("🔔 Stripe event received:", event.type);
    // Handle the event
    switch (event.type){

        //  case "checkout.session.completed": {
        // // case "payment_intent.succeeded":{
        //     const paymentIntent=event.data.object;
        //     const paymentIntentId=paymentIntent.id;
        //     // Getting Session Metadata
        //     const session=await stripeInstance.checkout.sessions.list({
        //         payment_intent:paymentIntentId,
        //     });

        //     console.log("🧾 Session metadata:", session.metadata);

        //     // ✅ Guard for missing metadata
        //     if (!session.metadata) {
        //         console.log("⚠️ No metadata found — skipping this event");
        //         break;
        //     }

        //     const {orderId,userId}=session.data[0].metadata;

        //     // Mark Payment as paid
        //     await Order.findByIdAndUpdate(orderId,{isPaid:true});
        //     // Clear user cart
        //     await User.findByIdAndUpdate(userId,{cartItems:{}});
        //     break;
        // }
         
        


        case "checkout.session.completed": {
        const session = event.data.object;

        console.log("🧾 Session metadata:", session.metadata);

        if (!session.metadata) {
            console.log("⚠️ No metadata found — skipping this event");
            break;
        }

        const { orderId, userId } = session.metadata;

        await Order.findByIdAndUpdate(orderId, {
            ispaid: true,
            // paymentType: "Online",
        });
        await User.findByIdAndUpdate(userId, { cartItems: {} });

        console.log("✅ Order marked paid:", orderId);
        break;
        }


        case "checkout.session.expired":{

        // case "payment_intent.payment_failed":{
            const paymentIntent=event.data.object;
            const paymentIntentId=paymentIntent.id;


            // Getting Session Metadata
            const session=await stripeInstance.checkout.sessions.list({
                payment_intent:paymentIntentId,
            });

            console.log("🧾 Session metadata:", session.metadata);

            const {orderId}=session.data[0].metadata;

            await Order.findByIdAndDelete(orderId);
            break;
        }

        default:
             
            console.error(`Unhandled event type ${event.type}`);
            break;
    }
    res.json({received:true});
   
}

// Place Order COD : /api/order/cod

export const placeOrderCOD=async (req,res) => {
       try {
        // const {userId,items,address}=req.body;
        const { items, address } = req.body;
        const userId = req.userId; // ✅ from middleware

        if(!address || items.length===0){
            return res.json({success:false,message:"Invalid data"})
        }
        // Calculate Amount Using Items
        let amount=await items.reduce(async (acc,item) => {
            const product=await Product.findById(item.product);
            return (await acc)+product.offerPrice * item.quantity;
        },0) // Initial acc value 0

        // Add Tax Charge (2%)
        amount+=Math.floor(amount*0.02);
        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType:"COD",
        })

        return res.json({success:true,message:"Order Placed Successfully"})
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}


//  Get Orders by User Id : /api/order/user

export const getUserOrders=async (req,res) => {
    try {
        // const {userId}=req.body;
        const userId = req.userId; // ✅ from middleware

        const orders=await Order.find({
            userId,
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt:-1});

        res.json({success:true,orders});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}


// Get All Orders ( for seller/admin ) :  /api/order/seller

export const getAllOrders=async (req,res) => {
    try {
        const orders=await Order.find({
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt:-1});
        res.json({success:true,orders});
    } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message});
    }
}