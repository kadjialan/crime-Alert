const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Crime = sequelize.define('Crime', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('theft', 'assault', 'robbery', 'vandalism', 'fraud', 'burglary', 'other'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  reportedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved', 'investigating'),
    defaultValue: 'active',
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // JSON-encoded array of base64 image data URIs (data:image/jpeg;base64,...).
  // Stored as LONGTEXT so we can fit a few compressed photos per report.
  // NOTE: MySQL forbids DEFAULT values on TEXT/BLOB columns, so we must
  // allow null and normalize in the getter/setter — otherwise sync({alter})
  // silently fails to add the column.
  images: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const raw = this.getDataValue('images');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(Array.isArray(value) ? value : []));
    },
  },
}, {
  timestamps: true,
});

module.exports = Crime;
