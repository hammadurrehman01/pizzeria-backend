import paypal from "paypal-rest-sdk";
import Order from "../models/OrderModel.js";

// Configuring PayPal SDK
const {
  PAYPAL_MODE,
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  PAYPAL_RETURN_URL,
  PAYPAL_CANCEL_URL,
} = process.env;

console.log(PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_SECRET);

// Configuring PayPal SDK
paypal.configure({
  mode: PAYPAL_MODE,
  client_id: PAYPAL_CLIENT_ID,
  client_secret: PAYPAL_SECRET,
});

// Create a payment
export const payForOrder = async (req, res) => {
  const {
    name,
    phoneNumber,
    street,
    city,
    zipCode,
    customizations,
    cartItems,
    ingredients,
    currency = "EUR",
  } = req.body;

  // Calculate the total amount from the cart items
  let totalAmount = cartItems
    ?.reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  // Add extra costs for ingredients (if any)
  const extraIngredientsCost =
    ingredients
      ?.reduce((sum, ingredient) => sum + ingredient.price, 0)
      .toFixed(2) || 0;
  totalAmount = (
    parseFloat(totalAmount) + parseFloat(extraIngredientsCost)
  ).toFixed(2);

  // Make sure we have a valid total amount
  if (totalAmount <= 0) {
    return res.status(400).json({ message: "Invalid order total amount." });
  }

  // Prepare payment request for PayPal
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: PAYPAL_RETURN_URL || "http://localhost:5000/api/success",
      cancel_url: PAYPAL_CANCEL_URL || "http://localhost:5000/api/cancel",
    },
    transactions: [
      {
        amount: {
          currency: currency, // Set to EUR here
          total: totalAmount,
        },
        item_list: {
          items: [
            ...cartItems.map((item) => ({
              name: item.name,
              sku: item.id?.toString(),
              price: item.price?.toFixed(2),
              currency: currency,
              quantity: item.quantity,
            })),
            ...ingredients?.map((ingredient) => ({
              name: ingredient.name,
              sku: ingredient.id?.toString(),
              price: ingredient.price?.toFixed(2),
              currency: currency,
              quantity: 1,
            })),
          ],
        },
        description: `Order for ${name}, Phone: ${phoneNumber}, Address: ${street}, ${city}, ${zipCode}. Customizations: ${customizations}. Ingredients: ${ingredients
          ?.map((ingredient) => ingredient.name)
          .join(", ")}`,
      },
    ],
  };

  // Create the payment with PayPal
  try {
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error);
        return res.status(400).json({ error: error.response });
      } else {
        // Get the approval URL from PayPal payment response
        const approval_url = payment.links.find(
          (link) => link.rel === "approval_url"
        )?.href;
        if (approval_url) {
          return res.send({ approval_url });
        }
        return res.status(404).json({ message: "No approval URL found" });
      }
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Handle the success of the payment
export const handleSuccess = async (req, res) => {
  const { payerId, paymentId } = req.query;

  // Validate payerId and paymentId
  if (!payerId || !paymentId) {
    return res.status(400).json({ message: "Missing payerId or paymentId." });
  }

  // Prepare the execute payment request
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "EUR",
          total: req.body.totalAmount || "0.00",
        },
      },
    ],
  };

  // Execute the payment
  try {
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      (error, payment) => {
        if (error) {
          console.error("Error executing payment:", error);
          return res.status(400).json({ error: error.response });
        } else {
          Order.updateOne(
            { _id: req.body.orderId },
            {
              paymentStatus: "Completed",
              orderStatus: "Pending",
            },
            (err, result) => {
              if (err) {
                console.error("Error updating order:", err);
                return res.status(500).json({ error: err.message });
              }
              console.log("Order updated successfully:", result);
            }
          );
          console.log("Payment executed successfully:", payment);

          // Redirect to the frontend success page
          return res.redirect("http://localhost:3000/success");
        }
      }
    );
  } catch (error) {
    console.error("Unexpected Error during payment execution:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Handle the failure of the payment
export const handleFailure = async (req, res) => {
  try {
    console.log("Payment failed, redirecting to failure page");
    return res.redirect("http://localhost:3000/failure");
  } catch (error) {
    console.error("Error during payment failure handling:", error);
    return res
      .status(500)
      .json({ message: "Error processing payment failure" });
  }
};
