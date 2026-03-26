const express = require('express');
const { Op, literal } = require('sequelize');
const { Crime, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: Haversine formula in SQL to find nearby records within a radius (in meters)
function nearbyWhere(lat, lon, radiusMeters) {
  const radiusKm = radiusMeters / 1000;
  return literal(
    `(6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lon})) + sin(radians(${lat})) * sin(radians(latitude)))) < ${radiusKm}`
  );
}

// Report a crime
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, type, severity, latitude, longitude, address, isEmergency } =
      req.body;

    const crime = await Crime.create({
      title,
      description,
      type,
      severity,
      latitude,
      longitude,
      address,
      reportedBy: req.user.id,
      isEmergency,
    });

    const crimeWithReporter = await Crime.findByPk(crime.id, {
      include: [{ model: User, as: 'reporter', attributes: ['name', 'email'] }],
    });

    // Emit to nearby users via socket
    const io = req.app.get('io');
    if (io) {
      // Find users within 5km radius
      const nearbyUsers = await User.findAll({
        where: {
          id: { [Op.ne]: req.user.id },
          [Op.and]: [nearbyWhere(latitude, longitude, 5000)],
        },
      });

      const alert = {
        crime: {
          id: crime.id,
          title: crime.title,
          type: crime.type,
          severity: crime.severity,
          isEmergency: crime.isEmergency,
          location: { coordinates: [longitude, latitude], address },
          description: crime.description,
          createdAt: crime.createdAt,
        },
        message: isEmergency
          ? `EMERGENCY: ${title} reported nearby!`
          : `Crime Alert: ${title} reported in your area.`,
      };

      nearbyUsers.forEach((user) => {
        io.to(user.id.toString()).emit('crime-alert', alert);
      });

      io.emit('new-crime', crimeWithReporter);
    }

    res.status(201).json(crimeWithReporter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get nearby crimes
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const crimes = await Crime.findAll({
      where: {
        [Op.and]: [nearbyWhere(parseFloat(latitude), parseFloat(longitude), parseInt(radius))],
      },
      include: [{ model: User, as: 'reporter', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Map to match frontend expected shape
    const mapped = crimes.map((c) => ({
      _id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      severity: c.severity,
      isEmergency: c.isEmergency,
      location: { coordinates: [c.longitude, c.latitude], address: c.address },
      reportedBy: c.reporter,
      status: c.status,
      createdAt: c.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all crimes (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { count, rows } = await Crime.findAndCountAll({
      include: [{ model: User, as: 'reporter', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    });

    const crimes = rows.map((c) => ({
      _id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      severity: c.severity,
      isEmergency: c.isEmergency,
      location: { coordinates: [c.longitude, c.latitude], address: c.address },
      reportedBy: c.reporter,
      status: c.status,
      createdAt: c.createdAt,
    }));

    res.json({ crimes, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send emergency alert
router.post('/emergency', auth, async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;

    const crime = await Crime.create({
      title: 'Emergency Alert',
      description: message || 'Emergency! Immediate help needed!',
      type: 'other',
      severity: 'critical',
      latitude,
      longitude,
      reportedBy: req.user.id,
      isEmergency: true,
    });

    const io = req.app.get('io');
    if (io) {
      const user = await User.findByPk(req.user.id, { attributes: ['name'] });
      io.emit('emergency-alert', {
        crime,
        sender: user.name,
        message: `EMERGENCY from ${user.name}: ${message || 'Immediate help needed!'}`,
        location: { latitude, longitude },
      });
    }

    res.status(201).json(crime);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
