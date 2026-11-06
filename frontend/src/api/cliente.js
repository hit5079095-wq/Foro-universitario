// Wrapper de fetch para la API del foro.
// El token se guarda aquí (además de en localStorage vía AuthContext) para que
// las peticiones lanzadas justo después de iniciar/cerrar sesión usen el valor nuevo,
// igual que la variable global `authToken` del script original.
let tokenActual = null;

export function establecerToken(token) {
  tokenActual = token || null;
}

export function obtenerToken() {
  return tokenActual;
}

/**
 * Hace una petición a la API y devuelve { status, json }.
 * - auth (por defecto true): añade Authorization: Bearer <token> si hay sesión.
 * - body: si se pasa, se envía como JSON.
 * Si la respuesta no es JSON, lanza (se trata como error de conexión, como antes).
 */
export async function peticion(url, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokenActual) headers['Authorization'] = `Bearer ${tokenActual}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}
