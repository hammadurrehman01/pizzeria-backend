import paypal from "paypal-rest-sdk";
import Order from "../models/OrderModel.js";

// Configuring PayPal SDK
paypal.configure({
  mode: "live",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

// Create PayPal payment
export const payForOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, name, phoneNumber, total } = req.body;

    const newOrder = new Order({
      items,
      name,
      phoneNumber,
      totalPrice: total,
      deliveryAddress,
      phoneNumber,
    });

    const savedOrder = await newOrder.save();
    console.log("savedOrder =>", savedOrder);

    // Get order details
    const order = await Order.findById(savedOrder._id).populate(
      "items.menuItem items.selectedIngredients"
    );

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "https://azzipizza.it/order-success",
        cancel_url: "https://azzipizza.it/payment-cancelled",
      },
      transactions: [
        {
          item_list: {
            items: items.map((item) => ({
              name: item.item_name,
              price: item.price,
              currency: "EUR",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "EUR",
            total: total,
          },
          description: "A purchase from Azzi Pizza",
        },
      ],
    };

    // Create PayPal payment
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error.response);

        return res.status(500).json({
          message: error.response.error || "Payment creation failed",
        });
      }

      const approvalUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      )?.href;

      if (!approvalUrl) {
        return res.status(500).json({ message: "No approval URL found" });
      }

      return res.json({ approvalUrl });
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
