import Menu from "../models/MenuModel.js";
import cloudinary from "../utils/cloudinary.js";

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

// Get a single menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu item", error: error.message });
  }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
  const { name, description, price, category, ingredients } = req.body;
  const image = req?.file?.path;
  try {
    // Validate required fields
    if (!name || !description || !price || !category || !ingredients) {
      return res.status(400).json({ message: "All fields are mandatory" });
    }
    const UploadImage = await cloudinary.uploader.upload(image);
    console.log("Cloudinary Upload Success:", UploadImage);

    // Create menu object
    const menuObject = {
      name,
      description,
      price,
      category,
      ingredients,
      image: UploadImage.secure_url,
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

// Update an existing menu item
export const updateMenuItem = async (req, res) => {
  const { name, description, price, category, ingredients } = req.body;

  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Update fields
    menuItem.name = name || menuItem.name;
    menuItem.description = description || menuItem.description;
    menuItem.price = price || menuItem.price;
    menuItem.category = category || menuItem.category;
    menuItem.ingredients = ingredients || menuItem.ingredients;

    // Save updated menu item
    const updatedMenuItem = await menuItem.save();

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
