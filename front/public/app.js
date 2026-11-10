const API = '/api';

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur ' + res.status);
  }
  return data;
}

function notify(text, isError = false) {
  const box = $('message');
  box.textContent = text;
  box.className = 'message ' + (isError ? 'error' : 'ok');
  box.hidden = false;
  setTimeout(() => {
    box.hidden = true;
  }, 4000);
}

function setSession(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(currentUser));
  showApp();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showApp();
}

function showSearchInfo(search) {
  $('search-info').innerHTML = search ? 'Résultats pour : <strong>' + search + '</strong>' : '';
}

function showApp() {
  const logged = Boolean(token && currentUser);
  $('auth-section').hidden = logged;
  $('todo-section').hidden = !logged;
  $('admin-section').hidden = true;
  $('nav').hidden = !logged;
  $('btn-admin').hidden = !(logged && currentUser.role === 'admin');

  if (logged) {
    $('whoami').textContent = 'Connecté : ' + currentUser.username;
    const q = new URLSearchParams(location.search).get('q') || '';
    $('search').value = q;
    loadTodos(q);
  }
}

/* ---------- Tâches ---------- */

async function loadTodos(search = '') {
  showSearchInfo(search);
  try {
    const path = '/todos' + (search ? '?search=' + encodeURIComponent(search) : '');
    renderTodos(await api(path));
  } catch (err) {
    notify(err.message, true);
    if (err.message.startsWith('Jeton')) {
      logout();
    }
  }
}

function renderTodos(todos) {
  const list = $('todo-list');
  list.innerHTML = '';
  if (todos.length === 0) {
    list.innerHTML = '<li class="empty">Aucune tâche.</li>';
    return;
  }
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    li.innerHTML = `
      <input type="checkbox" class="toggle" data-id="${todo.id}" ${todo.done ? 'checked' : ''}>
      <div class="content">
        <strong>${todo.title}</strong>
        <p>${todo.description || ''}</p>
      </div>
      <div class="actions">
        <button class="secondary edit" data-id="${todo.id}">Modifier</button>
        <button class="danger delete" data-id="${todo.id}">Supprimer</button>
      </div>`;
    list.appendChild(li);
  });
}

$('todo-list').addEventListener('click', async (event) => {
  const id = event.target.dataset.id;
  if (!id) return;
  try {
    if (event.target.classList.contains('delete')) {
      if (!confirm('Supprimer cette tâche ?')) return;
      await api('/todos/' + id, { method: 'DELETE' });
      notify('Tâche supprimée');
      loadTodos($('search').value);
    }
    if (event.target.classList.contains('edit')) {
      const current = event.target.closest('li').querySelector('strong').textContent;
      const title = prompt('Nouveau titre', current);
      if (!title) return;
      await api('/todos/' + id, { method: 'PUT', body: JSON.stringify({ title }) });
      loadTodos($('search').value);
    }
  } catch (err) {
    notify(err.message, true);
  }
});

$('todo-list').addEventListener('change', async (event) => {
  if (!event.target.classList.contains('toggle')) return;
  try {
    await api('/todos/' + event.target.dataset.id, {
      method: 'PUT',
      body: JSON.stringify({ done: event.target.checked }),
    });
    loadTodos($('search').value);
  } catch (err) {
    notify(err.message, true);
  }
});

$('todo-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: $('todo-title').value,
        description: $('todo-description').value,
      }),
    });
    $('todo-form').reset();
    notify('Tâche ajoutée');
    loadTodos($('search').value);
  } catch (err) {
    notify(err.message, true);
  }
});

$('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  loadTodos($('search').value);
});

/* ---------- Authentification ---------- */

$('tab-login').addEventListener('click', () => {
  $('tab-login').classList.add('active');
  $('tab-register').classList.remove('active');
  $('login-form').hidden = false;
  $('register-form').hidden = true;
});

$('tab-register').addEventListener('click', () => {
  $('tab-register').classList.add('active');
  $('tab-login').classList.remove('active');
  $('register-form').hidden = false;
  $('login-form').hidden = true;
});

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    setSession(
      await api('/login', {
        method: 'POST',
        body: JSON.stringify({
          username: $('login-username').value,
          password: $('login-password').value,
        }),
      })
    );
  } catch (err) {
    notify(err.message, true);
  }
});

$('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    setSession(
      await api('/register', {
        method: 'POST',
        body: JSON.stringify({
          username: $('register-username').value,
          email: $('register-email').value,
          password: $('register-password').value,
        }),
      })
    );
  } catch (err) {
    notify(err.message, true);
  }
});

$('btn-logout').addEventListener('click', logout);

/* ---------- Administration ---------- */

$('btn-admin').addEventListener('click', async () => {
  const showAdmin = $('admin-section').hidden;
  $('admin-section').hidden = !showAdmin;
  $('todo-section').hidden = showAdmin;
  if (!showAdmin) return;
  try {
    const users = await api('/admin/users');
    $('user-table').innerHTML = users
      .map(
        (u) => `<tr>
          <td>${u.id}</td><td>${u.username}</td><td>${u.email || ''}</td><td>${u.role}</td>
          <td><button class="danger" data-id="${u.id}">Supprimer</button></td>
        </tr>`
      )
      .join('');
  } catch (err) {
    notify(err.message, true);
  }
});

$('user-table').addEventListener('click', async (event) => {
  const id = event.target.dataset.id;
  if (!id || !confirm('Supprimer ce compte ?')) return;
  try {
    await api('/admin/users/' + id, { method: 'DELETE' });
    event.target.closest('tr').remove();
    notify('Compte supprimé');
  } catch (err) {
    notify(err.message, true);
  }
});

showSearchInfo(new URLSearchParams(location.search).get('q') || '');
showApp();
