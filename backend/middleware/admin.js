const { User } = require('../models');

module.exports = async function admin(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch {
    res.status(500).json({ message: 'Authorization check failed.' });
  }
};
