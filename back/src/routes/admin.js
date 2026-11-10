const express = require('express');
const pool = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();

router.use(authenticate);

router.get('/users', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, password, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
