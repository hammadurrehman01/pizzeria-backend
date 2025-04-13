import paypal from "paypal-rest-sdk";
import Order from "../models/OrderModel.js";

// Configuring PayPal SDK
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Create PayPal payment
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
      return_url: `${PAYPAL_BASE_URL}/api/success`,
      cancel_url: `${PAYPAL_BASE_URL}/api/cancel`,
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
    const { orderId, amount } = req.body;

    // Validate input
    if (!orderId || !amount) {
      return res.status(400).json({ message: "Missing order ID or amount" });
    }

    // Get order details
    const order = await Order.findById(orderId).populate(
      "items.menuItem items.selectedIngredients"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create PayPal payment payload
    const createPaymentJson = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url:
          process.env.PAYPAL_RETURN_URL ||
          "http://localhost:5000/api/payments/success",
        cancel_url:
          process.env.PAYPAL_CANCEL_URL ||
          "http://localhost:5000/api/payments/cancel",
      },
      transactions: [
        {
          amount: {
            currency: "EUR",
            total: (amount / 100).toFixed(2), // Convert cents to euros
          },
          item_list: {
            items: [
              ...order.items.map((item) => ({
                name: item.menuItem.name,
                sku: item.menuItem._id.toString(),
                price: (item.menuItem.price / 100).toFixed(2),
                currency: "EUR",
                quantity: item.quantity,
              })),
              ...order.items.flatMap((item) =>
                item.selectedIngredients.map((ingredient) => ({
                  name: `Extra ${ingredient.name}`,
                  sku: ingredient._id.toString(),
                  price: (ingredient.price / 100).toFixed(2),
                  currency: "EUR",
                  quantity: item.quantity,
                }))
              ),
            ],
          },
          description: `Order #${order._id}`,
        },
      ],
    };

    // Create PayPal payment
    paypal.payment.create(createPaymentJson, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error);
        return res.status(400).json({
          message: error.response.details || "Payment creation failed",
        });
      }

      const approvalUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      )?.href;

      if (!approvalUrl) {
        return res.status(500).json({ message: "No approval URL found" });
      }

      res.json({ approvalUrl });
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Handle successful payment
export const handleSuccess = async (req, res) => {
  try {
    const { paymentId, PayerID } = req.query;

    if (!paymentId || !PayerID) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Execute payment
    paypal.payment.execute(
      paymentId,
      { payer_id: PayerID },
      async (error, payment) => {
        if (error) {
          console.error("Error executing payment:", error);
          return res.status(400).json({ error: error.response });
        } else {
          await Order.updateOne(
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
          console.error("Payment Execution Error:", error);
          res.redirect(`${process.env.CLIENT_URL}/order-success`);
        }
      }
    );
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.redirect(`${process.env.CLIENT_URL}/payment-error`);
  }
};

// Handle cancelled payment
export const handleCancel = (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/payment-cancelled`);
};
