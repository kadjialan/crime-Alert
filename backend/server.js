require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const { sequelize, User } = require('./models');
const authRoutes = require('./routes/auth');
const crimeRoutes = require('./routes/crimes');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.set('io', io);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crimes', crimeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.json({ status: 'Crime Alert API running' }));

// Socket.io authentication and room joining
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  socket.join(socket.userId.toString());

  socket.on('update-location', async (data) => {
    try {
      const { User } = require('./models');
      await User.update(
        { latitude: data.latitude, longitude: data.longitude },
        { where: { id: socket.userId } }
      );
    } catch (err) {
      console.error('Location update error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Connect to MySQL and start server
const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log('Connected to MySQL - tables synced');

    // Seed default admin account
    const adminExists = await User.findOne({ where: { email: 'admin@crimealert.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@crimealert.com',
        password: 'admin123',
        phone: '',
        role: 'admin',
      });
      console.log('Default admin created: admin@crimealert.com / admin123');
    }

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MySQL connection error:', err.message);
    process.exit(1);
  });
