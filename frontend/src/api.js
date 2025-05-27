// API utility for authentication
const API_URL = 'http://localhost:5000/api/auth';

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function checkUsernameExists(username, role) {
  const res = await fetch(`${API_URL}/check-username?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`);
  return res.json();
}

export async function createUser({ username, password, role, token }) {
  const res = await fetch(`${API_URL}/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ username, password, role }),
  });
  return res.json();
}
