/**
 * sheetsApi.js — Conexión a Google Sheets como base de datos
 * 
 * CONFIGURACIÓN:
 * 1. Creá un archivo .env en la raíz del proyecto con:
 *    VITE_GOOGLE_SHEETS_ID=tu_id_del_sheet
 *    VITE_GOOGLE_SHEETS_API_KEY=tu_api_key
 * 
 * 2. El Google Sheet debe tener dos pestañas:
 *    - "perros" con columnas: id, name, breed, color, size, sex, ownerName, ownerPhone, neighborhood, notes, photo, type, lostSince, lastSeenLocation
 *    - "sightings" con columnas: id, dogId, text, location, date
 * 
 * 3. El Sheet debe estar compartido como "Cualquier persona con el enlace puede editar"
 */

const SHEET_ID = typeof import.meta !== 'undefined' 
  ? import.meta.env?.VITE_GOOGLE_SHEETS_ID 
  : '';
const API_KEY = typeof import.meta !== 'undefined' 
  ? import.meta.env?.VITE_GOOGLE_SHEETS_API_KEY 
  : '';

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// ─── Helpers ──────────────────────────────────────────────────────

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] || '';
  });
  return obj;
}

function objectToRow(headers, obj) {
  return headers.map(h => obj[h] || '');
}

// ─── READ: Obtener todos los perros ───────────────────────────────

export async function fetchDogs() {
  try {
    const res = await fetch(
      `${BASE_URL}/values/perros!A1:N1000?key=${API_KEY}`
    );
    const data = await res.json();
    
    if (!data.values || data.values.length < 2) return [];
    
    const headers = data.values[0];
    const dogs = data.values.slice(1).map(row => {
      const dog = rowToObject(headers, row);
      // Parsear sightings como array vacío (se cargan aparte)
      dog.sightings = [];
      return dog;
    }).filter(d => d.id); // Filtrar filas vacías
    
    return dogs;
  } catch (err) {
    console.error('Error fetching dogs:', err);
    return [];
  }
}

// ─── READ: Obtener avistamientos ──────────────────────────────────

export async function fetchSightings() {
  try {
    const res = await fetch(
      `${BASE_URL}/values/sightings!A1:E1000?key=${API_KEY}`
    );
    const data = await res.json();
    
    if (!data.values || data.values.length < 2) return [];
    
    const headers = data.values[0];
    return data.values.slice(1)
      .map(row => rowToObject(headers, row))
      .filter(s => s.id);
  } catch (err) {
    console.error('Error fetching sightings:', err);
    return [];
  }
}

// ─── READ: Cargar todo (perros + avistamientos combinados) ────────

export async function fetchAll() {
  const [dogs, sightings] = await Promise.all([
    fetchDogs(),
    fetchSightings(),
  ]);
  
  // Vincular avistamientos a cada perro
  return dogs.map(dog => ({
    ...dog,
    sightings: sightings.filter(s => s.dogId === dog.id),
    // Convertir strings vacíos a null para lostSince
    lostSince: dog.lostSince || null,
    lastSeenLocation: dog.lastSeenLocation || null,
  }));
}

// ─── WRITE: Agregar un perro ──────────────────────────────────────

export async function addDog(dog) {
  const headers = [
    'id', 'name', 'breed', 'color', 'size', 'sex',
    'ownerName', 'ownerPhone', 'neighborhood', 'notes',
    'photo', 'type', 'lostSince', 'lastSeenLocation'
  ];
  
  try {
    const res = await fetch(
      `${BASE_URL}/values/perros!A1:N1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [objectToRow(headers, dog)]
        })
      }
    );
    return res.ok;
  } catch (err) {
    console.error('Error adding dog:', err);
    return false;
  }
}

// ─── WRITE: Agregar avistamiento ──────────────────────────────────

export async function addSighting(sighting) {
  const headers = ['id', 'dogId', 'text', 'location', 'date'];
  
  try {
    const res = await fetch(
      `${BASE_URL}/values/sightings!A1:E1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [objectToRow(headers, sighting)]
        })
      }
    );
    return res.ok;
  } catch (err) {
    console.error('Error adding sighting:', err);
    return false;
  }
}

// ─── WRITE: Actualizar un campo de un perro ───────────────────────

export async function updateDogField(dogId, field, value) {
  // Primero necesitamos encontrar la fila del perro
  try {
    const res = await fetch(
      `${BASE_URL}/values/perros!A:A?key=${API_KEY}`
    );
    const data = await res.json();
    
    if (!data.values) return false;
    
    // Encontrar la fila (index 0 = header, +1 para Sheet)
    const rowIndex = data.values.findIndex(row => row[0] === dogId);
    if (rowIndex === -1) return false;
    
    const sheetRow = rowIndex + 1; // Sheets es 1-indexed
    
    // Mapear campo a columna
    const colMap = {
      id: 'A', name: 'B', breed: 'C', color: 'D', size: 'E', sex: 'F',
      ownerName: 'G', ownerPhone: 'H', neighborhood: 'I', notes: 'J',
      photo: 'K', type: 'L', lostSince: 'M', lastSeenLocation: 'N'
    };
    
    const col = colMap[field];
    if (!col) return false;
    
    const updateRes = await fetch(
      `${BASE_URL}/values/perros!${col}${sheetRow}?valueInputOption=RAW&key=${API_KEY}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [[value || '']]
        })
      }
    );
    return updateRes.ok;
  } catch (err) {
    console.error('Error updating dog:', err);
    return false;
  }
}

// ─── WRITE: Marcar como perdido ───────────────────────────────────

export async function markDogLost(dogId, lastLocation) {
  const now = new Date().toISOString();
  await updateDogField(dogId, 'lostSince', now);
  await updateDogField(dogId, 'lastSeenLocation', lastLocation || '');
  return true;
}

// ─── WRITE: Marcar como encontrado ────────────────────────────────

export async function markDogFound(dogId) {
  await updateDogField(dogId, 'lostSince', '');
  await updateDogField(dogId, 'lastSeenLocation', '');
  return true;
}

// ─── DELETE: Eliminar un perro (solo admin) ───────────────────────
// Nota: La API de Sheets no permite eliminar filas fácilmente con API Key.
// Opción: marcar como eliminado con un campo, o usar Service Account.
// Por ahora, el admin puede eliminar directamente desde Google Sheets.

export async function deleteDog(dogId) {
  // Para una implementación completa, necesitarías un Service Account
  // Por ahora, marcamos el tipo como "deleted" para ocultarlo
  return updateDogField(dogId, 'type', 'deleted');
}
