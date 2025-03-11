import jwt from "jsonwebtoken";

/**
 * Generates a JWT for the given user.
 * @param {Object} user - The user object.
 * @param {string} user.id - The user's unique identifier.
 * @returns {string} - The generated JWT.
 */
const generateToken = (user) => {
  const payload = { id: user.id };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "1h" };

  return jwt.sign(payload, secret, options);
};

export default generateToken;

// how to use
// import generateToken from './utils/generateToken'

// // Example user object
// const user = { id: 'user123' };

// const token = generateToken(user);
// console.log('Generated JWT:', token);
