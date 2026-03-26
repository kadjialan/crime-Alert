const sequelize = require('../config/database');
const User = require('./User');
const Crime = require('./Crime');

// Associations
User.hasMany(Crime, { foreignKey: 'reportedBy', as: 'crimes' });
Crime.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

module.exports = { sequelize, User, Crime };
