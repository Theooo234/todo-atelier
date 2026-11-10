CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(64) NOT NULL,
  email VARCHAR(120),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (username, password, email, role) VALUES
  ('admin', '$2a$10$DlJ1hm8ZpGZGc8hoNhMiy.vz3esRbrrA./VSFQdYyl8EWPW1R1D42', 'admin@atelier.local', 'admin'),
  ('alice', '$2a$10$sp5XR0z7ZMtDBKN3W.4ABujVPCsY2ZLpdNduawaNrN2hVFtQvQ9Oa', 'alice@atelier.local', 'user'),
  ('bob',   '$2a$10$YXWk6/6l.JTYyu7ZmwhzjORv3rQhmm0t4a46ZS9N2NCgwcHb4sNNK', 'bob@atelier.local',   'user');

INSERT INTO todos (user_id, title, description, done) VALUES
  (1, 'Sauvegarder la base de données', 'Vérifier que la sauvegarde de la nuit s’est bien terminée.', false),
  (1, 'Renouveler le certificat du serveur', 'Il expire à la fin du mois.', false),
  (1, 'Clé d’API de production', 'ATELIER-KEY-7F3A91 (à ne pas partager)', true),
  (2, 'Acheter du lait', 'Et du pain.', false),
  (2, 'Préparer le cours de lundi', 'Relire les slides sur la sécurité applicative.', false),
  (2, 'Réserver le train', 'Aller le vendredi soir, retour le dimanche.', true),
  (3, 'Réviser le cours de réseaux', 'Chapitre sur le routage.', false),
  (3, 'Appeler le dentiste', 'Prendre rendez-vous avant la fin de l’année.', false),
  (3, 'Code Wi-Fi du labo', 'LABO-WIFI-2026-fictif', true);
