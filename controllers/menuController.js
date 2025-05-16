import Menu from "../models/MenuModel.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Get all menu items
export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await Menu.find();
    res.status(200).json(menuItems);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
  }
};

export const getMenuItemById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid menu item ID format" });
  }

  try {
    const menuItem = await Menu.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res
      .status(500)
      .json({ message: "Error fetching menu item", error: error.message });
  }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, discount } = req.body;
    const image = req?.file?.path;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "All fields are mandatory" });
    }

    // Upload image to Cloudinary
    let uploadedImage;
    if (image) {
      uploadedImage = await cloudinary.uploader.upload(image);
    }

    // Parse ingredients (usually sent as a JSON string in multipart forms)
    let parsedIngredients = [];
    if (req.body.ingredients) {
      try {
        parsedIngredients = JSON.parse(req.body.ingredients);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ingredients format" });
      }
    }

    // Parse and validate discount (optional)
    const parsedDiscount = discount ? parseFloat(discount) : 0;
    if (parsedDiscount < 0) {
      return res.status(400).json({ message: "Discount cannot be negative" });
    }

    // Create the menu item object
    const menuObject = {
      name,
      description,
      price: parseFloat(price),
      discount: parsedDiscount,
      category,
      ingredients: parsedIngredients,
      image: uploadedImage?.secure_url || "",
    };

    // Save to database
    const newMenuItem = new Menu(menuObject);
    const savedMenuItem = await newMenuItem.save();

    res.status(201).json(savedMenuItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res
      .status(500)
      .json({ message: "Error creating menu item", error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  console.log("Update request received:", {
    body: req.body,
    file: req.file,
    params: req.params,
  });

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid menu item ID format" });
  }

  try {
    // Find existing menu item
    const menuItem = await Menu.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Handle image upload if new image was provided
    let imageUrl = menuItem.image;
    if (req.file) {
      // Upload new image to Cloudinary
      const uploadedImage = await cloudinary.uploader.upload(req.file.path);
      imageUrl = uploadedImage.secure_url;

      // Delete old image from Cloudinary
      if (menuItem.image) {
        const publicId = menuItem.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Parse ingredients (handle both FormData and JSON)
    let ingredients = menuItem.ingredients;
    if (req.body.ingredients) {
      try {
        ingredients =
          typeof req.body.ingredients === "string"
            ? JSON.parse(req.body.ingredients)
            : req.body.ingredients;
      } catch (err) {
        return res.status(400).json({ message: "Invalid ingredients format" });
      }
    }

    const updateData = {
      name: req.body.name || menuItem.name,
      description: req.body.description || menuItem.description,
      price:
        req.body.price !== undefined
          ? parseFloat(req.body.price)
          : menuItem.price,
      discount:
        req.body.discount !== undefined
          ? parseFloat(req.body.discount)
          : menuItem.discount,
      category: req.body.category || menuItem.category,
      ingredients: ingredients,
      available:
        req.body.available !== undefined
          ? req.body.available
          : menuItem.available,
      image: imageUrl,
    };
    // Update the menu item
    const updatedMenuItem = await Menu.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    console.log(updatedMenuItem);
    if (!updatedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({
      message: "Error updating menu item",
      error: error.message,
    });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const deletedMenuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res
      .status(200)
      .json({ message: "Menu item deleted successfully", deletedMenuItem });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res
      .status(500)
      .json({ message: "Error deleting menu item", error: error.message });
  }
};
