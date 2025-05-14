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
    const { items, total } = req.body;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `https://azzipizza.it/paypal-success`,
        cancel_url: `https://azzipizza.it/payment-cancelled`,
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

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error.response?.details || error);
        return res.status(500).json({
          message: "Payment creation failed",
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
    const {
      paymentId,
      PayerID,
      items,
      deliveryAddress,
      name,
      phoneNumber,
      total,
    } = req.body;

    if (!paymentId || !PayerID) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const execute_payment_json = {
      payer_id: PayerID,
      transactions: [
        {
          amount: {
            currency: "EUR",
            total: total,
          },
        },
      ],
    };

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      async (error, payment) => {
        if (error) {
          console.error("Error executing payment:", error.response || error);
          return res.status(400).json({ error: "Payment execution failed" });
        }

        // Save order to DB
        const newOrder = new Order({
          items,
          name,
          phoneNumber,
          totalPrice: total,
          deliveryAddress,
          paymentStatus: "Completed",
          orderStatus: "Pending",
        });

        const savedOrder = await newOrder.save();

        console.log("Order saved successfully:", savedOrder);
        res.status(200).json({
          message: "Payment successful and order saved",
          order: savedOrder,
        });
      }
    );
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Handle cancelled payment
export const handleCancel = (req, res) => {
  res.redirect(`https://azzipizza.it/payment-cancelled`);
};
