import Order from "../models/OrderModel.js";
import { satispayRequest } from "../utils/satispayRequest.js";
import { io } from "../index.js";
export const createCheckout = async (req, res) => {
  try {
    const {
      total,
      description = "Order Payment for Azzipizza",
      items,
      name,
      phoneNumber,
      deliveryAddress,
    } = req.body;

    const body = {
      amount_unit: Math.round(total * 100),
      currency: "EUR",
      callback_url: "https://azzipizza.it/api/webhook/satispay",
      redirect_url: "https://azzipizza.it/payment-success",
      metadata: {
        items,
        name,
        phoneNumber,
        deliveryAddress,
      },
      description,
    };

    const data = await satispayRequest("/payment_requests", "POST", body);

    if (data.status === "CREATED" && data.checkout_url) {
      res.json({ checkout_url: data.checkout_url });
    } else {
      throw new Error("Failed to create Satispay checkout");
    }
  } catch (err) {
    console.error("Satispay Checkout Error:", err);
    res.status(500).json({ error: "Satispay checkout creation failed" });
  }
};

export const satispayWebhook = async (req, res) => {
  try {
    const { id } = req.body;

    const data = await satispayRequest(`/payment_requests/${id}`, "GET");

    if (data.status !== "ACCEPTED") {
      return res.status(200).send("Payment not accepted");
    }

    const existingOrder = await Order.findOne({ paymentId: id });
    if (existingOrder) {
      console.log("⚠️ Duplicate webhook call for:", id);
      return res.status(200).send("Order already exists");
    }

    const { metadata } = data;

    const newOrder = new Order({
      paymentId: id,
      items: metadata.items,
      name: metadata.name,
      phoneNumber: metadata.phoneNumber,
      description,
      totalPrice: data.amount_unit / 100,
      deliveryAddress: metadata.deliveryAddress,
      paymentStatus: "Completed",
      orderStatus: "Pending",
      paymentMethod: "satispay",
    });

    const savedOrder = await newOrder.save();
    console.log("Order saved from Satispay:", savedOrder);

    io.emit("order-paid", {
      name: metadata.name,
      phoneNumber: metadata.phoneNumber,
      orderId: savedOrder._id,
    });

    res.status(200).send("Order saved");
  } catch (err) {
    console.error("Satispay webhook error:", err);
    res.status(500).send("Error processing Satispay webhook");
  }
};

export const handleCancel = (req, res) => {
  res.redirect("https://azzipizza.it/payment-cancelled");
};
