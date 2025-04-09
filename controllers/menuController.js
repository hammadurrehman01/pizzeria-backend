import Menu from "../models/MenuModel.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";

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

  // Check if the provided ID is a valid MongoDB ObjectId
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
    const { name, description, price, category } = req.body;
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

    // Create the menu item object
    const menuObject = {
      name,
      description,
      price,
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
  // Validate incoming data
  await body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .run(req);
  await body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .run(req);
  await body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .run(req);
  await body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string")
    .run(req);
  await body("ingredients")
    .optional()
    .isJSON()
    .withMessage("Ingredients must be a valid JSON")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category, ingredients, available } =
    req.body;

  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Parse ingredients if provided
    let parsedIngredients = menuItem.ingredients; // default to existing
    if (ingredients) {
      try {
        parsedIngredients = JSON.parse(ingredients);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ingredients format" });
      }
    }

    // Use findByIdAndUpdate for simplicity
    const updatedMenuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      {
        name: name || menuItem.name,
        description: description || menuItem.description,
        price: price || menuItem.price,
        category: category || menuItem.category,
        ingredients: parsedIngredients,
        available: available || menuItem.available,
      },
      { new: true } // Return the updated document
    );

    // If not found after update
    if (!updatedMenuItem) {
      return res
        .status(404)
        .json({ message: "Menu item not found after update" });
    }

    // Send success response
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res
      .status(500)
      .json({ message: "Error updating menu item", error: error.message });
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
