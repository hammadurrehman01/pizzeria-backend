import { sendUpdatedOrders } from "../index.js";
import Menu from "../models/MenuModel.js";
import Order from "../models/OrderModel.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, phoneNumber, name, total, customizations } =
      req.body;
    console.log("req.body =>", req.body);

    if (!items?.length) {
      return res
        .status(400)
        .json({ message: "At least one item is required." });
    }

    const orderItems = [];

    for (const item of items) {
      const { menuItem: menuItemId, quantity, selectedIngredients = [] } = item;

      if (!menuItemId || !quantity) {
        return res.status(400).json({
          message: "Each item must have a menuItem and quantity.",
        });
      }

      // Get menu item with ingredients
      const menuItem = await Menu.findById(menuItemId).populate("ingredients");
      if (!menuItem) {
        return res.status(404).json({
          message: `Menu item with ID ${menuItemId} not found.`,
        });
      }

      if (!Array.isArray(selectedIngredients)) {
        return res.status(400).json({
          message: "selectedIngredients must be an array of objects.",
        });
      }

      // Validate and store selected ingredients
      const matchedIngredients = selectedIngredients.map((ing) => {
        if (!ing._id || !ing.name || typeof ing.price !== "number") {
          throw new Error(
            "Each selected ingredient must include _id, name, and price."
          );
        }
        return {
          _id: ing._id,
          name: ing.name,
          price: ing.price,
        };
      });

      // Final item price = basePrice - discount + selectedIngredients total
      const basePrice = menuItem.price;
      const discountAmount =
        menuItem.discount && menuItem.discount > 0
          ? (menuItem.price * menuItem.discount) / 100
          : 0;
      const discountedPrice = parseFloat(
        (basePrice - discountAmount).toFixed(2)
      );

      // Build order item
      orderItems.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price: discountedPrice,
        originalPrice: basePrice,
        quantity,
        selectedIngredients: matchedIngredients,
        customizations: customizations || "",
      });
    }

    if (!deliveryAddress?.street || !deliveryAddress?.city) {
      return res.status(400).json({
        message: "Valid street and city in delivery address are required.",
      });
    }

    // Create and save order
    const newOrder = new Order({
      items: orderItems,
      name,
      totalPrice: total,
      deliveryAddress,
      phoneNumber,
    });

    const savedOrder = await newOrder.save();
    await sendUpdatedOrders();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
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

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, eta } = req.body;

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

    await sendUpdatedOrders(); // Socket.IO emit for real-time updates
    console.log("Order status updated in real-time!");

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
    await sendUpdatedOrders(); // Socket.IO emit for real-time updates
    console.log("Order deleted in real-time!");
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
};
