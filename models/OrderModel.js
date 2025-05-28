import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: [true, "Item is required"],
        },
        name: String,
        price: {
          type: Number,
          required: [true, "Item price is required"],
        },
        originalPrice: Number,
        selectedIngredients: [
          {
            name: String,
            price: Number,
          },
        ],
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: [1, "Quantity must be at least 1"],
        },
        customizations: String,
      },
    ],
    description: String,
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
    },

    paymentId: { type: String, unique: true, sparse: true },

    paymentMethod: {
      type: String,
      enum: ["cash", "satispay", "scan"],
      default: "cash",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Preparing", "Out for Delivery", "Delivered"],
      default: "Pending",
    },
    eta: {
      type: Date,
    },
    name: String,
    deliveryAddress: {
      street: {
        type: String,
        required: [true, "Street is required"],
      },
      city: {
        type: String,
        required: [true, "City Name is required"],
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
      },
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required"],
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
