import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/DBconnect.js";

// Import routes
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

connectDB();
// middleware
const app = express();
app.use(express());
app.use(express.urlencoded({ extended: true }));
// var corsOptions = {
//   origin: "http://localhost:5173",
//   optionsSuccessStatus: 200,
// };
app.use(cors());
app.use(express.json());
app.use(errorMiddleware);

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
