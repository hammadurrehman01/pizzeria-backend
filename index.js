import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import connectDB from "./config/DBconnect.js";
dotenv.config();

// Import routes
import { Server } from "socket.io";
import errorMiddleware from "./middleware/errorMiddleware.js";
import Order from "./models/OrderModel.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import axios from "axios";

// paypal
const generateAccessToken = async () => {
  try {
    const response = await axios({
      url: `https://api-m.sandbox.paypal.com/v1/oauth2/token`,
      method: "POST",
      data: "grant_type=client_credentials",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
    });
      return response.data.access_token;

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

const token = await generateAccessToken();
console.log("token", token)

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
