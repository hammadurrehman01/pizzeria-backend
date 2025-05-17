import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be greater than 0"],
    },
    discount: {
      type: Number,
      required: [true, "Discount Price is required"],
    },
    category: {
      type: String,
      enum: [
        "pizze rosse",
        "pizze bianche",
        "fritti",
        "dolci",
        "bibite",
        "birre",
      ],
      default: "pizze rosse",
      required: [true, "Category is required"],
    },
    image: {
      type: String,
    },
    ingredients: {
      type: [ingredientSchema],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Convert name to lowercase and trim it before saving
menuSchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim().toLowerCase();
  next();
});

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
