const payForOrder = async (req, res) => {
  try {
    const url = await createOrderPaypal();
    res.redirect(url);
  } catch (error) {
    console.log("Error: ", error.message);
  }
};
