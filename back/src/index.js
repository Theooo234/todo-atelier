const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const adminRoutes = require('./routes/admin');

const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONT_ORIGIN || 'http://localhost:8080' }));

app.use(cors({
  origin: process.env.FRONT_ORIGIN || 'http://localhost:8080',
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    node: process.version,
    uptime: process.uptime(),
  });
});

app.use('/api', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API démarrée sur le port ${port}`);
});
