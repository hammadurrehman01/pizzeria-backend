import { sendUpdatedOrders } from "../index.js";
import Order from "../models/OrderModel.js";

// ************* HAMMAD UR REHMAN ************* //
// this is a method of socket io for fetch real time updated

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      paymentStatus,
      orderStatus,
      deliveryAddress,
      phoneNumber,
      name,
      customizations,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required." });
    }

    // Fetch menuItem details and calculate total price
    let totalPriceOfItems = 0;
    for (const item of items) {
      if (!item.menuItem || !item.quantity) {
        return res.status(400).json({
          message: "Each item must have a menuItem and a quantity.",
        });
      }

      // Fetch the menuItem details from the database
      const menuItem = await Menu.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({
          message: `Menu item with ID ${item.menuItem} not found.`,
        });
      }

      // Calculate the total price for this item
      const price = parseFloat(menuItem.price);
      const quantity = parseInt(item.quantity);

      if (isNaN(price) || isNaN(quantity)) {
        throw new Error("Invalid price or quantity for an item.");
      }

      totalPriceOfItems += price * quantity;
    }

    // Create new order
    const newOrder = new Order({
      items,
      name,
      totalPrice: totalPriceOfItems,
      paymentStatus,
      orderStatus,
      deliveryAddress,
      phoneNumber,
      customizations,
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Send real-time updates
    await sendUpdatedOrders();
    console.log("Order sent in real-time!");

    // Return the saved order
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
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
