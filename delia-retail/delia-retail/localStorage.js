/* ═══════════════════════════════════════════════════
   DELIA RETAIL – Sistema de Inventarios
   localStorage.js
   Capa de acceso y persistencia de datos.
   Todas las operaciones con localStorage pasan aquí.
═══════════════════════════════════════════════════ */

/**
 * Objeto principal de almacenamiento.
 * Envuelve localStorage con manejo de errores y serialización JSON.
 */
var Storage = {

  /**
   * Lee un valor de localStorage.
   * @param {string} key - Clave a leer
   * @returns {*} El valor parseado, o null si no existe o hay error
   */
  get: function(key) {
    try {
      var item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('[Storage.get] Error leyendo clave "' + key + '":', e);
      return null;
    }
  },

  /**
   * Guarda un valor en localStorage.
   * @param {string} key   - Clave a guardar
   * @param {*}      value - Valor a serializar y guardar
   */
  set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage.set] Error guardando clave "' + key + '":', e);
    }
  },

  /**
   * Elimina una clave de localStorage.
   * @param {string} key - Clave a eliminar
   */
  remove: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage.remove] Error eliminando clave "' + key + '":', e);
    }
  }
};

/* ─────────────────────────────────────────
   CLAVES USADAS EN LA APLICACIÓN
───────────────────────────────────────── */
var KEYS = {
  INIT:       'dr_init',       // Bandera de inicialización
  SESSION:    'dr_session',    // ID del usuario con sesión activa
  USERS:      'dr_users',      // Lista de usuarios
  CATEGORIES: 'dr_cats',       // Lista de categorías
  PRODUCTS:   'dr_prods',      // Lista de productos
  MOVEMENTS:  'dr_movs'        // Historial de movimientos
};

/* ─────────────────────────────────────────
   INICIALIZACIÓN CON DATOS DEMO
   Se ejecuta solo la primera vez (cuando
   no existe la bandera dr_init).
───────────────────────────────────────── */
function initData() {
  if (Storage.get(KEYS.INIT)) return; // Ya inicializado

  // Usuarios por defecto
  Storage.set(KEYS.USERS, [
    { id: 'u1', name: 'Administrador', username: 'admin', password: 'admin123', role: 'administrador' },
    { id: 'u2', name: 'Empleado Demo', username: 'emp',   password: 'emp123',   role: 'empleado'      }
  ]);

  // Categorías por defecto
  Storage.set(KEYS.CATEGORIES, [
    { id: 'c1', name: 'Electrónica', color: '#38bdf8' },
    { id: 'c2', name: 'Ropa',        color: '#f97316' },
    { id: 'c3', name: 'Alimentos',   color: '#22c55e' },
    { id: 'c4', name: 'Hogar',       color: '#a78bfa' }
  ]);

  // Productos de ejemplo
  var now = new Date().toISOString();
  Storage.set(KEYS.PRODUCTS, [
    { id:'p1', code:'SKU-001', name:'Laptop Pro 15"',   desc:'Alto rendimiento',  catId:'c1', stock:12, minStock:3,  price:1200, createdAt: now },
    { id:'p2', code:'SKU-002', name:'Teclado Mecánico', desc:'Switches red',      catId:'c1', stock:4,  minStock:5,  price:85,   createdAt: now },
    { id:'p3', code:'SKU-003', name:'Camiseta Básica',  desc:'100% algodón',      catId:'c2', stock:0,  minStock:10, price:15,   createdAt: now },
    { id:'p4', code:'SKU-004', name:'Arroz 5kg',        desc:'Grano largo',       catId:'c3', stock:30, minStock:10, price:8,    createdAt: now },
    { id:'p5', code:'SKU-005', name:'Lámpara LED',      desc:'12W luz cálida',    catId:'c4', stock:8,  minStock:5,  price:22,   createdAt: now }
  ]);

  // Movimientos de ejemplo
  Storage.set(KEYS.MOVEMENTS, [
    { id:'m1', prodId:'p1', type:'entrada', qty:15, before:0,  after:15, userId:'u1', note:'Stock inicial',    date: daysAgo(3) },
    { id:'m2', prodId:'p3', type:'salida',  qty:10, before:10, after:0,  userId:'u2', note:'Venta lote',       date: daysAgo(2) },
    { id:'m3', prodId:'p2', type:'entrada', qty:4,  before:0,  after:4,  userId:'u1', note:'Compra proveedor', date: daysAgo(1) }
  ]);

  // Marcar como inicializado
  Storage.set(KEYS.INIT, true);
}

/* ─────────────────────────────────────────
   HELPERS DE FECHA
───────────────────────────────────────── */

/** Retorna la fecha/hora actual en formato ISO */
function nowISO() {
  return new Date().toISOString();
}

/** Retorna una fecha ISO hace N días */
function daysAgo(n) {
  return new Date(Date.now() - 86400000 * n).toISOString();
}

/** Formatea una fecha ISO para mostrar al usuario */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return iso;
  }
}

/* ─────────────────────────────────────────
   HELPERS GENERALES
───────────────────────────────────────── */

/** Formatea número con separadores de miles */
function fmt(n) {
  return Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

/** Capitaliza la primera letra de un string */
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Genera un ID único basado en timestamp */
function genId(prefix) {
  return (prefix || 'id') + Date.now();
}
