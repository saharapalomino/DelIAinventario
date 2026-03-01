/* ═══════════════════════════════════════════════════
   DELIA RETAIL – Sistema de Inventarios
   app.js
   Lógica principal: autenticación, navegación,
   CRUD de productos, movimientos y categorías,
   dashboard y estadísticas.
═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────────── */
var CU         = null;           // Usuario activo (Current User)
var activeSec  = 'dashboard';    // Sección activa actual
var CAT_COLORS = ['#38bdf8','#f97316','#22c55e','#a78bfa','#f43f5e','#f59e0b','#3b82f6','#ec4899'];

/* ─────────────────────────────────────────
   DEFINICIÓN DE MENÚ LATERAL
───────────────────────────────────────── */
var NAVS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: 'bi-speedometer2',    admin: false },
  { id: 'products',   label: 'Productos',    icon: 'bi-box-seam',         admin: false },
  { id: 'movements',  label: 'Movimientos',  icon: 'bi-arrow-left-right', admin: false },
  { sep: true },
  { id: 'categories', label: 'Categorías',   icon: 'bi-tags',             admin: true  },
  { id: 'stats',      label: 'Estadísticas', icon: 'bi-bar-chart-line',   admin: true  }
];

/* ═══════════════════════════════════════
   AUTH – Autenticación
═══════════════════════════════════════ */

/**
 * Muestra una de las sub-vistas del login (login o registro).
 * @param {string} id - 'vLogin' o 'vReg'
 */
function showView(id) {
  document.getElementById('vLogin').style.display = (id === 'vLogin') ? '' : 'none';
  document.getElementById('vReg').style.display   = (id === 'vReg')   ? '' : 'none';
}

/** Procesa el formulario de login */
function doLogin() {
  var username = document.getElementById('lUser').value.trim();
  var password = document.getElementById('lPass').value;

  if (!username || !password) {
    toast('Ingresa usuario y contraseña', 'err');
    return;
  }

  var users = Storage.get(KEYS.USERS) || [];
  var user  = users.find(function(u) {
    return u.username === username && u.password === password;
  });

  if (!user) {
    toast('Usuario o contraseña incorrectos', 'err');
    return;
  }

  // Guardar sesión y lanzar la app
  CU = user;
  Storage.set(KEYS.SESSION, user.id);
  launchApp();
}

/** Procesa el formulario de registro de nuevo usuario */
function doRegister() {
  var name  = document.getElementById('rName').value.trim();
  var uname = document.getElementById('rUser').value.trim();
  var pass  = document.getElementById('rPass').value;
  var role  = document.getElementById('rRole').value;

  if (!name || !uname || !pass) {
    toast('Completa todos los campos', 'err');
    return;
  }

  var users = Storage.get(KEYS.USERS) || [];

  // Verificar que el username no exista
  if (users.find(function(u) { return u.username === uname; })) {
    toast('Ese nombre de usuario ya existe', 'err');
    return;
  }

  users.push({
    id:       genId('u'),
    name:     name,
    username: uname,
    password: pass,
    role:     role
  });
  Storage.set(KEYS.USERS, users);

  toast('Cuenta creada. Inicia sesión.', 'ok');
  showView('vLogin');
}

/** Cierra la sesión actual */
function doLogout() {
  CU = null;
  Storage.set(KEYS.SESSION, null);
  document.getElementById('shell').style.display     = 'none';
  document.getElementById('auth-wrap').style.display = 'flex';
  document.getElementById('lUser').value = '';
  document.getElementById('lPass').value = '';
}

/**
 * Verifica si hay sesión guardada al cargar la página.
 * @returns {boolean} true si hay sesión válida
 */
function checkSession() {
  var sid  = Storage.get(KEYS.SESSION);
  if (!sid) return false;
  var user = (Storage.get(KEYS.USERS) || []).find(function(u) { return u.id === sid; });
  if (user) { CU = user; return true; }
  return false;
}

/* ═══════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════ */

/** Construye el menú lateral según el rol del usuario activo */
function buildNav() {
  var nav     = document.getElementById('sNav');
  var isAdmin = CU.role === 'administrador';
  nav.innerHTML = '';

  for (var i = 0; i < NAVS.length; i++) {
    var item = NAVS[i];

    // Separador de sección admin
    if (item.sep) {
      if (isAdmin) {
        var sep = document.createElement('div');
        sep.className   = 's-sep';
        sep.textContent = 'Administración';
        nav.appendChild(sep);
      }
      continue;
    }

    // Ocultar ítems admin si el usuario no es administrador
    if (item.admin && !isAdmin) continue;

    // Crear botón de navegación (IIFE para capturar itemId correctamente)
    (function(itemId, itemLabel, itemIcon) {
      var btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.setAttribute('data-sec', itemId);
      btn.innerHTML = '<i class="bi ' + itemIcon + '"></i>' + itemLabel;
      btn.addEventListener('click', function() { goTo(itemId); });
      nav.appendChild(btn);
    })(item.id, item.label, item.icon);
  }

  // Actualizar info del usuario en el sidebar
  document.getElementById('sName').textContent = CU.name;
  document.getElementById('sRole').textContent = cap(CU.role);

  var av = document.getElementById('sAvatar');
  av.textContent = CU.name.charAt(0).toUpperCase();
  av.className   = 'avatar ' + (CU.role === 'administrador' ? 'av-admin' : 'av-emp');
}

/**
 * Navega a una sección de la aplicación.
 * @param {string} sec - ID de la sección ('dashboard', 'products', etc.)
 */
function goTo(sec) {
  activeSec = sec;

  // Mostrar solo la sección activa
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('on'); });
  var el = document.getElementById('sec-' + sec);
  if (el) el.classList.add('on');

  // Marcar botón activo en el menú
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('on'); });
  var nb = document.querySelector('[data-sec="' + sec + '"]');
  if (nb) nb.classList.add('on');

  // Actualizar título del topbar
  var titles = {
    dashboard:  'Dashboard',
    products:   'Productos',
    movements:  'Movimientos',
    categories: 'Categorías',
    stats:      'Estadísticas'
  };
  document.getElementById('pageTitle').textContent = titles[sec] || sec;

  // Renderizar el contenido de la sección
  renderSec(sec);

  // Cerrar sidebar en móvil
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

/**
 * Delega el renderizado al módulo correspondiente.
 * @param {string} s - ID de sección
 */
function renderSec(s) {
  if (s === 'dashboard')  renderDash();
  if (s === 'products')   renderProducts();
  if (s === 'movements')  renderMovements();
  if (s === 'categories') renderCats();
  if (s === 'stats')      renderStats();
}

/** Abre/cierra el sidebar en móvil */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */

/** Renderiza el panel principal con estadísticas y tablas resumidas */
function renderDash() {
  var prods = Storage.get(KEYS.PRODUCTS)  || [];
  var movs  = Storage.get(KEYS.MOVEMENTS) || [];
  var users = Storage.get(KEYS.USERS)     || [];

  // ── Tarjetas de estadísticas ──
  var totalVal = prods.reduce(function(a, p) { return a + (p.stock * p.price); }, 0);
  var lowCnt   = prods.filter(function(p) { return p.stock > 0 && p.stock <= p.minStock; }).length;
  var outCnt   = prods.filter(function(p) { return p.stock === 0; }).length;

  document.getElementById('dashStats').innerHTML =
    buildStatCard('#f97316', 'bi-box-seam',            prods.length,     'Productos totales')  +
    buildStatCard('#22c55e', 'bi-currency-dollar',     '$' + fmt(totalVal), 'Valor en inventario') +
    buildStatCard('#f59e0b', 'bi-exclamation-triangle', lowCnt,           'Con stock bajo')     +
    buildStatCard('#ef4444', 'bi-x-circle',            outCnt,           'Sin stock');

  // ── Últimos 8 movimientos ──
  var sorted = movs.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);
  document.getElementById('dashMovTb').innerHTML = sorted.length
    ? sorted.map(function(m) {
        var p = prods.find(function(x) { return x.id === m.prodId; });
        var u = users.find(function(x) { return x.id === m.userId; });
        return '<tr>' +
          '<td>' + (p ? p.name : '–') + '</td>' +
          '<td><span class="badge b-' + m.type + '">' + cap(m.type) + '</span></td>' +
          '<td>' + m.qty + '</td>' +
          '<td>' + (u ? u.name : '–') + '</td>' +
          '<td style="color:var(--muted);font-size:.76rem">' + fmtDate(m.date) + '</td>' +
          '</tr>';
      }).join('')
    : '<tr><td colspan="5"><div class="empty"><i class="bi bi-inbox"></i>Sin movimientos aún</div></td></tr>';

  // ── Stock crítico (stock <= mínimo) ──
  var crit = prods.filter(function(p) { return p.stock <= p.minStock; })
               .sort(function(a, b) { return a.stock - b.stock; }).slice(0, 6);
  document.getElementById('dashCritTb').innerHTML = crit.length
    ? crit.map(function(p) {
        return '<tr><td>' + p.name + '</td><td><strong>' + p.stock + '</strong></td><td>' + stockBadge(p) + '</td></tr>';
      }).join('')
    : '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--green)">✓ Todo en orden</td></tr>';
}

/**
 * Construye el HTML de una tarjeta de estadística.
 * @param {string} color  - Color del ícono
 * @param {string} icon   - Clase del ícono de Bootstrap Icons
 * @param {*}      val    - Valor a mostrar
 * @param {string} label  - Etiqueta descriptiva
 * @returns {string} HTML de la tarjeta
 */
function buildStatCard(color, icon, val, label) {
  return '<div class="col-6 col-lg-3"><div class="scard">' +
    '<div class="scard-icon" style="background:' + color + '22;color:' + color + '">' +
      '<i class="bi ' + icon + '"></i>' +
    '</div>' +
    '<div class="sval">' + val + '</div>' +
    '<div class="slabel">' + label + '</div>' +
    '</div></div>';
}

/* ═══════════════════════════════════════
   PRODUCTOS – CRUD completo
═══════════════════════════════════════ */

/** Renderiza la tabla de productos con filtros aplicados */
function renderProducts() {
  var prods = Storage.get(KEYS.PRODUCTS)   || [];
  var cats  = Storage.get(KEYS.CATEGORIES) || [];

  var q    = (document.getElementById('pSearch') ? document.getElementById('pSearch').value : '').toLowerCase();
  var catF = document.getElementById('pCatF')    ? document.getElementById('pCatF').value    : '';

  // Actualizar el select de categorías en el filtro
  var pCatFEl = document.getElementById('pCatF');
  var prevCat = pCatFEl.value;
  pCatFEl.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
  if (prevCat) pCatFEl.value = prevCat;

  // Poblar el select de categorías del modal
  document.getElementById('pCat').innerHTML = cats.map(function(c) {
    return '<option value="' + c.id + '">' + c.name + '</option>';
  }).join('');

  // Controlar visibilidad del botón "Nuevo Producto"
  document.getElementById('btnAddProd').style.display = CU.role === 'administrador' ? '' : 'none';

  // Filtrar productos
  var filtered = prods.filter(function(p) {
    var mQ = !q || p.name.toLowerCase().indexOf(q) >= 0 || p.code.toLowerCase().indexOf(q) >= 0;
    var mC = !catF || p.catId === catF;
    return mQ && mC;
  });

  var tb = document.getElementById('prodTb');

  if (!filtered.length) {
    tb.innerHTML = '<tr><td colspan="7"><div class="empty"><i class="bi bi-search"></i>Sin resultados</div></td></tr>';
    return;
  }

  var isAdmin = CU.role === 'administrador';

  tb.innerHTML = filtered.map(function(p) {
    var cat     = cats.find(function(c) { return c.id === p.catId; });
    // Escapar correctamente el nombre para el atributo onclick
    var prodName = (p.name || '').replace(/'/g, "\\'").replace(/"/g, '&#34;');
    var actions = isAdmin
      ? '<button class="btn-icon btn-edit" onclick="openProdModal(\'' + p.id + '\')" title="Editar">' +
          '<i class="bi bi-pencil-square"></i></button> ' +
        '<button class="btn-icon btn-del" onclick="confirmDel(\'prod\',\'' + p.id + '\',\'' + prodName + '\')" title="Eliminar">' +
          '<i class="bi bi-trash3"></i></button>'
      : '<span style="color:var(--muted);font-size:.78rem">Solo lectura</span>';

    return '<tr>' +
      '<td style="color:var(--muted);font-size:.76rem">' + p.code + '</td>' +
      '<td><strong>' + p.name + '</strong>' + (p.desc ? '<br><small style="color:var(--muted)">' + p.desc + '</small>' : '') + '</td>' +
      '<td><span class="badge b-cat">' + (cat ? cat.name : '–') + '</span></td>' +
      '<td><strong style="font-family:\'Syne\',sans-serif;font-size:1.05rem">' + p.stock + '</strong> <small style="color:var(--muted)">/ mín ' + p.minStock + '</small></td>' +
      '<td>$' + Number(p.price).toFixed(2) + '</td>' +
      '<td>' + stockBadge(p) + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

/**
 * Abre el modal de producto (crear o editar).
 * @param {string|null} id - ID del producto a editar, o null para crear
 */
function openProdModal(id) {
  var cats = Storage.get(KEYS.CATEGORIES) || [];
  document.getElementById('pCat').innerHTML = cats.map(function(c) {
    return '<option value="' + c.id + '">' + c.name + '</option>';
  }).join('');

  if (id) {
    // Modo edición
    var prods = Storage.get(KEYS.PRODUCTS) || [];
    var p     = prods.find(function(x) { return x.id === id; });
    if (!p) return;

    document.getElementById('mProdTitle').textContent = 'Editar Producto';
    document.getElementById('pId').value    = p.id;
    document.getElementById('pCode').value  = p.code;
    document.getElementById('pName').value  = p.name;
    document.getElementById('pDesc').value  = p.desc || '';
    document.getElementById('pStock').value = p.stock;
    document.getElementById('pMin').value   = p.minStock;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pCat').value   = p.catId;
  } else {
    // Modo creación
    document.getElementById('mProdTitle').textContent = 'Nuevo Producto';
    document.getElementById('pId').value    = '';
    document.getElementById('pCode').value  = 'SKU-' + String(Date.now()).slice(-4);
    document.getElementById('pName').value  = '';
    document.getElementById('pDesc').value  = '';
    document.getElementById('pStock').value = 0;
    document.getElementById('pMin').value   = 5;
    document.getElementById('pPrice').value = 0;
  }

  showModal('mProd');
}

/** Guarda el producto (crear o actualizar) desde el modal */
function saveProd() {
  var id       = document.getElementById('pId').value;
  var code     = document.getElementById('pCode').value.trim();
  var name     = document.getElementById('pName').value.trim();
  var catId    = document.getElementById('pCat').value;
  var stock    = parseInt(document.getElementById('pStock').value)   || 0;
  var minStock = parseInt(document.getElementById('pMin').value)     || 0;
  var price    = parseFloat(document.getElementById('pPrice').value) || 0;
  var desc     = document.getElementById('pDesc').value.trim();

  if (!code || !name) {
    toast('El código y el nombre son obligatorios', 'err');
    return;
  }

  var prods = Storage.get(KEYS.PRODUCTS) || [];

  if (id) {
    // Actualizar producto existente
    prods = prods.map(function(p) {
      return p.id === id
        ? Object.assign({}, p, { code: code, name: name, desc: desc, catId: catId, stock: stock, minStock: minStock, price: price })
        : p;
    });
    toast('Producto actualizado correctamente', 'ok');
  } else {
    // Crear nuevo producto
    prods.push({
      id:        genId('p'),
      code:      code,
      name:      name,
      desc:      desc,
      catId:     catId,
      stock:     stock,
      minStock:  minStock,
      price:     price,
      createdAt: nowISO()
    });
    toast('Producto creado correctamente', 'ok');
  }

  Storage.set(KEYS.PRODUCTS, prods);
  hideModal('mProd');
  renderProducts();
}

/**
 * Elimina un producto por ID.
 * @param {string} id - ID del producto
 */
function delProd(id) {
  var prods = (Storage.get(KEYS.PRODUCTS) || []).filter(function(p) { return p.id !== id; });
  Storage.set(KEYS.PRODUCTS, prods);
  toast('Producto eliminado', 'ok');
  renderProducts();
}

/* ═══════════════════════════════════════
   MOVIMIENTOS – Entradas, Salidas, Pérdidas
═══════════════════════════════════════ */

/** Renderiza la tabla de historial de movimientos con filtros */
function renderMovements() {
  var movs  = Storage.get(KEYS.MOVEMENTS) || [];
  var prods = Storage.get(KEYS.PRODUCTS)  || [];
  var users = Storage.get(KEYS.USERS)     || [];

  var q     = (document.getElementById('mSearch') ? document.getElementById('mSearch').value : '').toLowerCase();
  var typeF = document.getElementById('mTypeF')   ? document.getElementById('mTypeF').value   : '';

  // Ordenar por fecha descendente y filtrar
  var filtered = movs.slice()
    .sort(function(a, b) { return new Date(b.date) - new Date(a.date); })
    .filter(function(m) {
      var p  = prods.find(function(x) { return x.id === m.prodId; });
      var mQ = !q     || (p && p.name.toLowerCase().indexOf(q) >= 0);
      var mT = !typeF || m.type === typeF;
      return mQ && mT;
    });

  var tb = document.getElementById('movTb');
  tb.innerHTML = filtered.length
    ? filtered.map(function(m) {
        var p = prods.find(function(x) { return x.id === m.prodId; });
        var u = users.find(function(x) { return x.id === m.userId; });
        return '<tr>' +
          '<td style="font-size:.76rem;color:var(--muted)">' + fmtDate(m.date)  + '</td>' +
          '<td>' + (p ? p.name : '–') + '</td>' +
          '<td><span class="badge b-' + m.type + '">' + cap(m.type) + '</span></td>' +
          '<td><strong>' + m.qty + '</strong></td>' +
          '<td>' + m.before + '</td>' +
          '<td>' + m.after  + '</td>' +
          '<td>' + (u ? u.name : '–') + '</td>' +
          '<td style="color:var(--muted);font-size:.82rem">' + (m.note || '–') + '</td>' +
          '</tr>';
      }).join('')
    : '<tr><td colspan="8"><div class="empty"><i class="bi bi-inbox"></i>Sin movimientos</div></td></tr>';
}

/** Abre el modal para registrar un nuevo movimiento */
function openMovModal() {
  var prods = Storage.get(KEYS.PRODUCTS) || [];
  document.getElementById('mvProd').innerHTML = prods.map(function(p) {
    return '<option value="' + p.id + '">' + p.name + ' (' + p.code + ')</option>';
  }).join('');
  document.getElementById('mvQty').value  = 1;
  document.getElementById('mvNote').value = '';
  document.getElementById('mvType').value = 'entrada';
  updMovStock();
  showModal('mMov');
}

/** Actualiza el indicador de stock actual al cambiar el producto seleccionado */
function updMovStock() {
  var pid   = document.getElementById('mvProd') ? document.getElementById('mvProd').value : null;
  var prods = Storage.get(KEYS.PRODUCTS) || [];
  var p     = prods.find(function(x) { return x.id === pid; });
  document.getElementById('mvCurStock').textContent = p ? p.stock : '–';
}

/** Guarda el movimiento y actualiza el stock del producto */
function saveMov() {
  var pid  = document.getElementById('mvProd').value;
  var type = document.getElementById('mvType').value;
  var qty  = parseInt(document.getElementById('mvQty').value) || 0;
  var note = document.getElementById('mvNote').value.trim();

  if (qty <= 0) {
    toast('La cantidad debe ser mayor a 0', 'err');
    return;
  }

  var prods = Storage.get(KEYS.PRODUCTS) || [];
  var idx   = prods.findIndex(function(p) { return p.id === pid; });
  if (idx === -1) { toast('Producto no encontrado', 'err'); return; }

  var before = prods[idx].stock;
  var after;

  if (type === 'entrada') {
    // Entrada: suma stock
    after = before + qty;
  } else {
    // Salida o pérdida: resta stock con validación
    if (qty > before) {
      toast('Stock insuficiente para esta operación', 'err');
      return;
    }
    after = before - qty;
  }

  // Actualizar stock del producto
  prods[idx].stock = after;
  Storage.set(KEYS.PRODUCTS, prods);

  // Registrar el movimiento en el historial
  var movs = Storage.get(KEYS.MOVEMENTS) || [];
  movs.push({
    id:     genId('m'),
    prodId: pid,
    type:   type,
    qty:    qty,
    before: before,
    after:  after,
    userId: CU.id,
    note:   note,
    date:   nowISO()
  });
  Storage.set(KEYS.MOVEMENTS, movs);

  toast('Movimiento registrado · Stock: ' + before + ' → ' + after, 'ok');
  hideModal('mMov');
  renderSec(activeSec); // Refrescar la sección activa
}

/* ═══════════════════════════════════════
   CATEGORÍAS – CRUD
═══════════════════════════════════════ */

/** Renderiza la grilla de categorías */
function renderCats() {
  var cats  = Storage.get(KEYS.CATEGORIES) || [];
  var prods = Storage.get(KEYS.PRODUCTS)   || [];
  var grid  = document.getElementById('catGrid');

  if (!cats.length) {
    grid.innerHTML = '<div class="col"><div class="empty"><i class="bi bi-tags"></i>Sin categorías aún</div></div>';
    return;
  }

  grid.innerHTML = cats.map(function(c) {
    var count = prods.filter(function(p) { return p.catId === c.id; }).length;
    // Escapar correctamente el nombre de categoría
    var catName = (c.name || '').replace(/'/g, "\\'").replace(/"/g, '&#34;');
    return '<div class="col-sm-6 col-lg-4"><div class="scard">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">' +
        '<div style="width:14px;height:14px;border-radius:4px;background:' + c.color + ';margin-top:3px;flex-shrink:0"></div>' +
        '<div style="display:flex;gap:4px">' +
          '<button class="btn-icon btn-edit" onclick="openCatModal(\'' + c.id + '\')" title="Editar"><i class="bi bi-pencil-square"></i></button>' +
          '<button class="btn-icon btn-del"  onclick="confirmDel(\'cat\',\'' + c.id + '\',\'' + catName + '\')" title="Eliminar"><i class="bi bi-trash3"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="sval" style="font-size:1.5rem">' + c.name + '</div>' +
      '<div class="slabel">' + count + ' producto' + (count !== 1 ? 's' : '') + '</div>' +
      '</div></div>';
  }).join('');
}

/**
 * Abre el modal de categoría (crear o editar).
 * @param {string|null} id - ID de la categoría a editar, o null para crear
 */
function openCatModal(id) {
  // Construir la paleta de colores
  var cp = document.getElementById('cColorPicker');
  cp.innerHTML = CAT_COLORS.map(function(col) {
    return '<div class="color-dot" style="background:' + col + '" data-col="' + col + '" onclick="pickColor(\'' + col + '\')"></div>';
  }).join('');

  if (id) {
    var cats = Storage.get(KEYS.CATEGORIES) || [];
    var c    = cats.find(function(x) { return x.id === id; });
    if (!c) return;

    document.getElementById('mCatTitle').textContent = 'Editar Categoría';
    document.getElementById('cId').value    = c.id;
    document.getElementById('cName').value  = c.name;
    document.getElementById('cColor').value = c.color;
    pickColor(c.color);
  } else {
    document.getElementById('mCatTitle').textContent = 'Nueva Categoría';
    document.getElementById('cId').value    = '';
    document.getElementById('cName').value  = '';
    document.getElementById('cColor').value = CAT_COLORS[0];
    pickColor(CAT_COLORS[0]);
  }

  showModal('mCat');
}

/**
 * Selecciona un color en la paleta del modal de categoría.
 * @param {string} col - Color en hex
 */
function pickColor(col) {
  document.getElementById('cColor').value = col;
  document.querySelectorAll('.color-dot').forEach(function(d) {
    if (d.dataset.col === col) d.classList.add('picked');
    else d.classList.remove('picked');
  });
}

/** Guarda la categoría (crear o actualizar) */
function saveCat() {
  var id    = document.getElementById('cId').value;
  var name  = document.getElementById('cName').value.trim();
  var color = document.getElementById('cColor').value;

  if (!name) { toast('El nombre es obligatorio', 'err'); return; }

  var cats = Storage.get(KEYS.CATEGORIES) || [];

  if (id) {
    cats = cats.map(function(c) {
      return c.id === id ? Object.assign({}, c, { name: name, color: color }) : c;
    });
    toast('Categoría actualizada', 'ok');
  } else {
    cats.push({ id: genId('c'), name: name, color: color });
    toast('Categoría creada', 'ok');
  }

  Storage.set(KEYS.CATEGORIES, cats);
  hideModal('mCat');
  renderCats();
}

/**
 * Elimina una categoría si no tiene productos asociados.
 * @param {string} id - ID de la categoría
 */
function delCat(id) {
  var prods = Storage.get(KEYS.PRODUCTS) || [];
  if (prods.some(function(p) { return p.catId === id; })) {
    toast('No puedes eliminar una categoría con productos asignados', 'err');
    return;
  }
  var cats = (Storage.get(KEYS.CATEGORIES) || []).filter(function(c) { return c.id !== id; });
  Storage.set(KEYS.CATEGORIES, cats);
  toast('Categoría eliminada', 'ok');
  renderCats();
}

/* ═══════════════════════════════════════
   ESTADÍSTICAS – Panel de análisis (solo admin)
═══════════════════════════════════════ */

/** Renderiza el panel de estadísticas */
function renderStats() {
  var prods = Storage.get(KEYS.PRODUCTS)   || [];
  var movs  = Storage.get(KEYS.MOVEMENTS)  || [];
  var cats  = Storage.get(KEYS.CATEGORIES) || [];

  // Contar movimientos por producto
  var movCnt = {};
  movs.forEach(function(m) { movCnt[m.prodId] = (movCnt[m.prodId] || 0) + 1; });

  // Top 5 productos con más movimientos
  var top5 = prods.slice()
    .sort(function(a, b) { return (movCnt[b.id] || 0) - (movCnt[a.id] || 0); })
    .slice(0, 5);
  var maxMov = 1;
  top5.forEach(function(p) { if ((movCnt[p.id] || 0) > maxMov) maxMov = movCnt[p.id]; });

  // Estadísticas por categoría
  var catStats = cats.map(function(c) {
    var cp = prods.filter(function(p) { return p.catId === c.id; });
    return Object.assign({}, c, {
      count: cp.length,
      val:   cp.reduce(function(a, p) { return a + (p.stock * p.price); }, 0),
      stock: cp.reduce(function(a, p) { return a + p.stock; }, 0)
    });
  }).filter(function(c) { return c.count > 0; });

  var maxVal = 1;
  catStats.forEach(function(c) { if (c.val > maxVal) maxVal = c.val; });

  document.getElementById('statsContent').innerHTML =
    // Gráfico de barras – movimientos por producto
    '<div class="col-lg-6"><div class="twrap" style="padding:20px">' +
      '<h6 style="margin-bottom:18px">Productos con más Movimientos</h6>' +
      top5.map(function(p) {
        var pct = Math.round((movCnt[p.id] || 0) / maxMov * 100);
        return '<div style="margin-bottom:14px">' +
          '<div style="display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:4px">' +
            '<span>' + p.name + '</span>' +
            '<span style="color:var(--muted)">' + (movCnt[p.id] || 0) + ' mov.</span>' +
          '</div>' +
          '<div class="prog-bg"><div class="prog-fill" style="width:' + pct + '%;background:var(--accent)"></div></div>' +
          '</div>';
      }).join('') +
    '</div></div>' +

    // Gráfico de barras – valor por categoría
    '<div class="col-lg-6"><div class="twrap" style="padding:20px">' +
      '<h6 style="margin-bottom:18px">Valor de Inventario por Categoría</h6>' +
      catStats.map(function(c) {
        var pct = Math.round(c.val / maxVal * 100);
        return '<div style="margin-bottom:14px">' +
          '<div style="display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:4px">' +
            '<span>' + c.name + '</span>' +
            '<span style="color:var(--muted)">$' + fmt(c.val) + '</span>' +
          '</div>' +
          '<div class="prog-bg"><div class="prog-fill" style="width:' + pct + '%;background:' + c.color + '"></div></div>' +
          '</div>';
      }).join('') +
    '</div></div>' +

    // Tabla resumen por categoría
    '<div class="col-12"><div class="twrap">' +
      '<div class="twrap-head"><h6>Resumen por Categoría</h6></div>' +
      '<table class="t"><thead><tr><th>Categoría</th><th>Productos</th><th>Stock Total</th><th>Valor Total</th></tr></thead>' +
      '<tbody>' +
      catStats.map(function(c) {
        return '<tr>' +
          '<td><span class="badge b-cat">' + c.name + '</span></td>' +
          '<td>' + c.count + '</td>' +
          '<td>' + c.stock + '</td>' +
          '<td>$' + fmt(c.val)  + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>' +
    '</div></div>';
}

/* ═══════════════════════════════════════
   ELIMINAR – Modal de confirmación
═══════════════════════════════════════ */

/**
 * Muestra el modal de confirmación de eliminación.
 * @param {string} type - 'prod' o 'cat'
 * @param {string} id   - ID del elemento a eliminar
 * @param {string} name - Nombre del elemento (para el mensaje)
 */
function confirmDel(type, id, name) {
  document.getElementById('confirmMsg').textContent =
    '¿Eliminar "' + name + '"? Esta acción no se puede deshacer.';

  document.getElementById('confirmOk').onclick = function() {
    if (type === 'prod') delProd(id);
    else if (type === 'cat') delCat(id);
    hideModal('mConfirm');
  };

  showModal('mConfirm');
}

/* ═══════════════════════════════════════
   UTILIDADES DE MODAL
═══════════════════════════════════════ */

/**
 * Abre un modal de Bootstrap por su ID.
 * @param {string} id - ID del elemento modal
 */
function showModal(id) {
  var el = document.getElementById(id);
  bootstrap.Modal.getOrCreateInstance(el).show();
}

/**
 * Cierra un modal de Bootstrap por su ID.
 * @param {string} id - ID del elemento modal
 */
function hideModal(id) {
  var el = document.getElementById(id);
  var m  = bootstrap.Modal.getInstance(el);
  if (m) m.hide();
}

/* ═══════════════════════════════════════
   UTILIDADES DE UI
═══════════════════════════════════════ */

/**
 * Genera el HTML del badge de estado de stock.
 * @param {Object} p - Producto
 * @returns {string} HTML del badge
 */
function stockBadge(p) {
  if (p.stock === 0)        return '<span class="badge b-out">Sin Stock</span>';
  if (p.stock <= p.minStock) return '<span class="badge b-low">Stock Bajo</span>';
  return '<span class="badge b-ok">OK</span>';
}

/**
 * Muestra una notificación toast al usuario.
 * @param {string} msg  - Mensaje a mostrar
 * @param {string} type - 'ok', 'err' o 'info'
 */
function toast(msg, type) {
  type = type || 'info';
  var c = document.getElementById('toasts');
  var t = document.createElement('div');
  var icons = { ok: 'bi-check-circle-fill', err: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
  var cls   = { ok: 't-ok', err: 't-err', info: 't-info' };

  t.className = 't-msg ' + (cls[type] || 't-info');
  t.innerHTML = '<i class="bi ' + (icons[type] || icons.info) + '" style="flex-shrink:0"></i>' + msg;
  c.appendChild(t);

  setTimeout(function() {
    t.style.transition = 'opacity .3s';
    t.style.opacity    = '0';
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
  }, 3200);
}

/* ═══════════════════════════════════════
   BOOT – Inicialización de la aplicación
═══════════════════════════════════════ */

/**
 * Lanza la aplicación principal después de autenticarse.
 * Construye la UI y navega al dashboard.
 */
function launchApp() {
  document.getElementById('auth-wrap').style.display = 'none';
  document.getElementById('shell').style.display     = 'block';

  buildNav();

  // Mostrar fecha actual en el topbar
  document.getElementById('topDate').textContent =
    new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

  goTo('dashboard');
}

// Inicializar datos demo y comprobar sesión activa al cargar la página
initData();
if (checkSession()) {
  launchApp();
}
