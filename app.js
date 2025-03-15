import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
dotenv.config();
import connectDB from "./config/DBconnect.js";

// Import routes
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { Server } from "socket.io";
import Order from "./models/OrderModel.js";
import axios from "axios";

connectDB();
// middleware
const app = express();
const server = createServer(app);

app.use(express());
app.use(express.urlencoded({ extended: true }));
// var corsOptions = {
//   origin: "http://localhost:5173",
//   optionsSuccessStatus: 200,
// };
app.use(cors());
app.use(express.json());
app.use(errorMiddleware);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});



const generateAccessToken = async () => {
   try {
    console.log(process.env.PAYPAL_CLIENT_ID) 
    console.log(process.env.PAYPAL_SECRET) 
     const response = await axios({
         url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
         method: "post",
         data: "grant_type=client_credentials",
         auth: {
             username: process.env.PAYPAL_CLIENT_ID,
             password: process.env.PAYPAL_SECRET,
         }
     })
    console.log(response.data);

   } catch (error) {
    console.error("Error:", error.response?.data || error.message);
   }

}


generateAccessToken()


export const sendUpdatedOrders = async () => {
  try {
    const orders = await Order.find().populate(
      "items.menuItem",
      "name price category"
    );
    io.emit("latestOrders", orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

// Use routes
app.get("/", (req, res) => {
  res.status(200).json({
    message: "api is working",
    menuRoutes: "/api/menu",
    orderRoutes: "/api/orders",
    paymentRoutes: "/api/payments",
  });
});
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
// app.use("/api/payments", paymentRoutes);


const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
