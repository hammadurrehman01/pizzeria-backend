/**
 * Calculates the total price of an order.
 * @param {Array} items - The array of items in the order.
 * @param {string} items[].name - The name of the item.
 * @param {number} items[].price - The price of the item.
 * @param {number} items[].quantity - The quantity of the item.
 * @returns {number} - The total price of the order.
 */
const calculatePrice = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

export default calculatePrice;

// how to use

// import calculatePrice from './utils/calculatePrice'

// // Example order items
// const orderItems = [
//   { name: 'Margherita Pizza', price: 10, quantity: 2 },
//   { name: 'Pepperoni Pizza', price: 12, quantity: 1 },
// ];

// const totalPrice = calculatePrice(orderItems);
// console.log('Total Price:', totalPrice);
