import mongoose from "mongoose";

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
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: [
        "Pizze rosse",
        "Pizze bianche",
        "fritti",
        "Dolci",
        "bibite",
        "birre",
      ],
      default: "Pizze rosse",
      required: [true, "Category is required"],
    },
    image: { type: String },
    ingredients: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook
menuSchema.pre("save", function (next) {
  this.name = this.name.trim().toLowerCase();
  next();
});

// Custom validation
menuSchema.path("price").validate(function (value) {
  return value > 0;
}, "Price must be greater than 0");

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
