const express = require('express');
const { User, Crime } = require('../models');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, admin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCrimes = await Crime.count();
    const activeCrimes = await Crime.count({ where: { status: 'active' } });
    const emergencies = await Crime.count({ where: { isEmergency: true } });
    const resolvedCrimes = await Crime.count({ where: { status: 'resolved' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    // Recent crimes (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCrimes = await Crime.count({
      where: { createdAt: { [require('sequelize').Op.gte]: weekAgo } },
    });

    res.json({
      totalUsers,
      totalCrimes,
      activeCrimes,
      emergencies,
      resolvedCrimes,
      adminCount,
      recentCrimes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await user.update({ role });
    res.json({ message: `User role updated to ${role}.`, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await user.destroy();
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all crimes (admin view)
router.get('/crimes', async (req, res) => {
  try {
    const crimes = await Crime.findAll({
      include: [{ model: User, as: 'reporter', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(crimes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update crime status
router.put('/crimes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'resolved', 'investigating'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const crime = await Crime.findByPk(req.params.id);
    if (!crime) return res.status(404).json({ message: 'Crime not found.' });

    await crime.update({ status });
    res.json({ message: `Crime status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a crime
router.delete('/crimes/:id', async (req, res) => {
  try {
    const crime = await Crime.findByPk(req.params.id);
    if (!crime) return res.status(404).json({ message: 'Crime not found.' });

    await crime.destroy();
    res.json({ message: 'Crime report deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
