import paypal from "paypal-rest-sdk"

const { PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env

console.log(PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_SECRET);


paypal.configure({
  mode: PAYPAL_MODE,
  client_id: PAYPAL_CLIENT_ID,
  client_secret: PAYPAL_SECRET,
});

export const payForOrder = async (req, res) => {
  const { name, phoneNumber, street, city, zipCode, customizations, cartItems } = req.body;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  try {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal"
      },
      redirect_urls: {
        return_url: "http://localhost:5000/api/success",
        cancel_url: "http://localhost:5000/api/cancel"
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: totalAmount
          },
          item_list: {
            items: cartItems.map(item => ({
              name: item.name,
              sku: item.id.toString(),
              price: item.price.toFixed(2),
              currency: "USD",
              quantity: item.quantity
            }))
          },
          description: `Order for ${name}, Phone: ${phoneNumber}, Address: ${street}, ${city}, ${zipCode}. Customizations: ${customizations}`
        }
      ]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error);
        return res.status(400).json({ error: error.response });
      } else {
        const approval_url = payment.links.find((link) => link.rel === "approval_url")?.href;
        if (approval_url) {
          return res.send({ approval_url });
        }
        return res.status(404).json({ message: "No approval URL found" });
      }
    });

  } catch (error) {
    console.error("Unexpected Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


export const handleSuccess = async (req, res) => {
  const { payerId, paymentId } = req.query;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD"
      },
      "total": "25:00"
    }]
  }

  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    if (error) {
      console.error(error)
      throw error
    } else {
      const response = JSON.stringify(payment);
      const parsedResponse = JSON.parse(response);

      console.log("parsedResponse ==>>", parsedResponse);

      return res.redirect("http://localhost:3000/success")

    }
  })
}


export const handleFailure = async (req, res) => {
  try {
    return res.redirect("http://localhost:3000/failure")
  } catch (error) {
    console.error(error)
  }
}