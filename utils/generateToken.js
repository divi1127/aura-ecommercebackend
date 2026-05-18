import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_dev_mode', {
    expiresIn: '30d'
  });
};

export default generateToken;
