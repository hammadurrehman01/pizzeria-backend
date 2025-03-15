import axios from "axios";

const generateAccessToken = async () => {
  try {
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: "POST",
      data: "grant_type=client_credentials",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

export const createOrderPaypal = async () => {
  const token = generateAccessToken();

  const response = await axios({
    url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          items: [
            {
              name: "Fajita Pizza",
              description: "Large size Fajita Pizza with full of topings",
              quantity: ``,
              unit_amount: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          ],
          amount: {
            currency_code: "USD",
            value: "100.00",
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          },
        },
      ],
      application_context: {
        return_url: `${process.env.BASE_URL}/complete-order`,
        cancel_url: `${process.env.BASE_URL}/cancel-order`,
        shipping_preference: "NO_SHIPPING",
        user_acation: "PAY_NOW",
        brand_name: "Azzipizza",
      },
    }),
  });
  return response.data.links.find((link) => link.rel === "approve").href;
};

export const capturePaypalPayment = async (orderId) => {
  const accessToken = await generateAccessToken();

  const response = await axios({
    url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders${orderId}/capture`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
