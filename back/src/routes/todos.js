const express = require('express');
const pool = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();

router.use(authenticate);

// Liste des tâches de l’utilisateur connecté, avec recherche optionnelle
router.get('/', async (req, res) => {
  const search = req.query.search || '';
  try {
    const result = await pool.query(
      `SELECT * FROM todos
       WHERE user_id = $1
         AND ($2 = '' OR title ILIKE '%' || $2 || '%')
       ORDER BY created_at DESC, id DESC`,
      [req.user.id, search]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' });
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Le titre est obligatoire' });
    }
    const result = await pool.query(
      'INSERT INTO todos (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, title, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, done } = req.body;
    const result = await pool.query(
      `UPDATE todos
          SET title = COALESCE($1, title),
              description = COALESCE($2, description),
              done = COALESCE($3, done)
        WHERE id = $4
        RETURNING *`,
      [title ?? null, description ?? null, done ?? null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable' });
    }
    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
