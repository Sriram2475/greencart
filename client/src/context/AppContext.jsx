import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

// To send cookies in api request
axios.defaults.withCredentials=true;
// Set backend url as base url
axios.defaults.baseURL=import.meta.env.VITE_BACKEND_URL;

export const AppContext=createContext();
export const AppContextProvider =({children})=>{

const currency=import.meta.env.VITE_CURRENCY;

const navigate=useNavigate();
const [user,setUser]=useState(null);
const [isSeller,setIsSeller]=useState(false);
const [showUserLogin,setshowUserLogin]=useState(false);
const [products,setproducts]=useState([]);
const [cartItems,setcartItems]=useState({});
const [searchQuery,setsearchQuery]=useState({});

// Fetch Seller Status
const fetchSeller=async () => {
    try {
        const {data}=await axios.get('/api/seller/is-auth');
        if(data.success){
            setIsSeller(true);
        }
        else{
            setIsSeller(false);
        }
    } catch (error) {
        setIsSeller(false);
    }
}


//Fetch User auth status , User Data and Cart Items
const fetchUser=async () => {
    try {
        const {data}=await axios.get('/api/user/is-auth');
        if(data.success){
            setUser(data.user);
            setcartItems(data.user.cartItems);
        }
    } catch (error) {
        setUser(null);
    }
}


//Fetch all products
const fetchProducts=async()=>{
    // setproducts(dummyProducts);
    try {
         const {data}=await axios.get('/api/product/list');
         if(data.success){
            setproducts(data.products);
         }
         else{
            toast.error(data.message);
         }
    } catch (error) {
         toast.error(error.message);
    }
}

//Add product to cart
const addToCart=(itemId)=>{
    let cartData=structuredClone(cartItems);
    if(cartData[itemId]){
        cartData[itemId]+=1;
    }
    else{
        cartData[itemId]=1;
    }
    //Setter function
    setcartItems(cartData);
    //Notification
    toast.success("Added to Cart");
}

//Update cart items quantity
const updateCartItem=(itemId,quantity)=>{
    let cartData=structuredClone(cartItems);
    cartData[itemId]=quantity;
    setcartItems(cartData)
    toast.success("Cart Updated")
}

//Remove product from cart
const removeFromCart=(itemId)=>{
    let cartData=structuredClone(cartItems);
    if(cartData[itemId]){
        cartData[itemId]-=1;
        if(cartData[itemId]===0){
            delete cartData[itemId];
        }
    }
    toast.success("Removed from cart");
    setcartItems(cartData);

}

// Get cart item count
const getCartCount=()=>{
    let totalCount=0;
    for(const item in cartItems){
        totalCount+=cartItems[item];
    }
    return totalCount;
}

// Get cart total amount

const getCartAmount=()=>{
    let totalAmount=0;
    for(const items in cartItems){
        let itemInfo=products.find((product)=>product._id===items);
        if(cartItems[items]>0){
            totalAmount+=itemInfo.offerPrice*cartItems[items]

        }

    }
    return Math.floor(totalAmount*100)/100;
}

useEffect(()=>{
    fetchUser()
    fetchSeller()
    fetchProducts()
},[])

// Update Database Cart Items
useEffect(()=>{
    const updateCart=async () => {
        try {
            const {data}=await axios.post('/api/cart/update',{cartItems});
            if(!data.success){
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    if(user){
        updateCart();
    }
},[cartItems])

const value={navigate,user,setUser,isSeller,setIsSeller,showUserLogin,
    setshowUserLogin,products,currency,addToCart,
    updateCartItem,removeFromCart,cartItems,searchQuery,
    setsearchQuery,getCartAmount,getCartCount,axios, fetchProducts,setcartItems}
return <AppContext.Provider value={value}>
    {children}
</AppContext.Provider>
}

export const useAppContext=()=>{
    return useContext(AppContext)
}