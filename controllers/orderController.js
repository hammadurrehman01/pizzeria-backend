import Order from "../models/OrderModel.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalPrice,
      paymentStatus,
      orderStatus,
      deliveryAddress,
      phoneNumber,
      name,
    } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required." });
    }

    const newOrder = new Order({
      items,
      name,
      totalPrice,
      paymentStatus,
      orderStatus,
      deliveryAddress,
      phoneNumber,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error });
  }
};

// Get all orders with menu item details
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate(
      "items.menuItem",
      "name price category"
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.menuItem"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error });
  }
};

// Update order
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, eta } = req.body;
    const validStatuses = ["Preparing", "Out for Delivery", "Delivered"];

    // Prepare the update object (only update `eta` if it's provided)
    const updateData = { orderStatus };
    if (eta) {
      updateData.eta = eta;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order updated successfully",
      updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating order status", error });
  }
};

// Delete an order safely
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
};
