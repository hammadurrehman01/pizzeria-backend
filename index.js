import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import connectDB from "./config/DBconnect.js";
import { Server } from "socket.io";

import errorMiddleware from "./middleware/errorMiddleware.js";
import Order from "./models/OrderModel.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://azzipizza-customer.vercel.app",
  "https://azzi-pizza-admin-panel.vercel.app",
  "https://azzipizza.it",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("🔥 Request from:", req.headers.origin, req.method, req.url);
  next();
});

export const io = new Server(server, {
  cors: corsOptions,
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

app.get("/", (req, res) => {
  res.status(200).json({
    message: "api is working",
    menuRoutes: "/api/menu",
    orderRoutes: "/api/orders",
    paymentRoutes: "/api/payment",
  });
});

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
