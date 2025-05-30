// API utility for authentication
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

// Consumption Items CRUD API
const ITEMS_URL = import.meta.env.VITE_ITEMS_API_URL || 'http://localhost:5000/api/items';

export async function getConsumptionItems(token, search = '') {
  const url = search ? `${ITEMS_URL}?search=${encodeURIComponent(search)}` : ITEMS_URL;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function createConsumptionItem({ item_name, kilowatts, token }) {
  const res = await fetch(ITEMS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ item_name, kilowatts })
  });
  return res.json();
}

export async function updateConsumptionItem({ id, item_name, kilowatts, token }) {
  const res = await fetch(`${ITEMS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ item_name, kilowatts })
  });
  return res.json();
}

export async function deleteConsumptionItem({ id, token }) {
  const res = await fetch(`${ITEMS_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signup({ email, password, first_name, last_name, profile_picture, office_unit }) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name, last_name, profile_picture, office_unit }),
  });
  return res.json();
}

// Username check removed: now using email as identifier.
// If needed, implement checkEmailExists instead.

export async function checkEmailExists(email, role) {
  const res = await fetch(
    `${API_URL}/check-email?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`,
    { method: 'GET' }
  );
  return res.json(); // Should return { exists: true/false }
}


// Upload monthly electricity consumption data (from DOSTResourceMonitoringLEGIT)
const ELECTRICITY_API_URL = 'http://localhost:5000/api/electricity';
export async function uploadElectricityData(formData, token) {
  const res = await fetch(ELECTRICITY_API_URL, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function createUser({ email, password, role, token, first_name, last_name, profile_picture, office_unit }) {
  const res = await fetch(`${API_URL}/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email, password, role, first_name, last_name, profile_picture, office_unit }),
  });
  return res.json();
}
