import { sendUpdatedOrders } from "../index.js";
import Menu from "../models/MenuModel.js";
import Order from "../models/OrderModel.js";

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
    } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required." });
    }

    let totalPriceOfItems = 0;
    const orderItems = [];

    for (const item of items) {
      const {
        menuItem: menuItemId,
        quantity,
        selectedIngredients = [],
        customizations,
      } = item;

      if (!menuItemId || !quantity) {
        return res.status(400).json({
          message: "Each item must have a menuItem and quantity.",
        });
      }

      const menuItem = await Menu.findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          message: `Menu item with ID ${menuItemId} not found.`,
        });
      }

      // Filter selected ingredients that exist in the menu item
      const matchedIngredients = menuItem.ingredients
        .filter((ing) => selectedIngredients.includes(ing.name))
        .map((ing) => ({
          name: ing.name,
          price: ing.price,
        }));

      // Calculate price
      const basePrice = parseFloat(menuItem.price);
      console.log(basePrice);
      const ingredientsPrice = matchedIngredients.reduce(
        (sum, ing) => sum + (ing.price || 0),
        0
      );
      console.log(ingredientsPrice);
      const itemTotalPrice =
        (basePrice + ingredientsPrice) * parseInt(quantity);

      totalPriceOfItems += itemTotalPrice;
      console.log(totalPriceOfItems);

      // Build final item to push in order
      orderItems.push({
        menuItem: menuItemId,
        quantity,
        ingredients: matchedIngredients,
        customizations: customizations || "",
      });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({
        message: "Delivery address with street and city is required.",
      });
    }

    const newOrder = new Order({
      items: orderItems,
      name,
      totalPrice: totalPriceOfItems,
      paymentStatus,
      orderStatus,
      deliveryAddress,
      phoneNumber,
    });

    const savedOrder = await newOrder.save();

    await sendUpdatedOrders(); // Socket.IO emit for real-time updates
    console.log("Order sent in real-time!");

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
