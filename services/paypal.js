import axios from "axios";

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
  const token = await generateAccessToken();

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


export default generateAccessToken