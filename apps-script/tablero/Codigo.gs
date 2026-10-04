/**
 * Tablero de finanzas - app web en vivo sobre la hoja de finanzas
 *
 * Lee las pestañas que usa el bot de Telegram (Movimientos, Cuentas, Cuotas tarjeta, Personas,
 * Préstamos, Cuotas préstamo, Activos, Operaciones inversión, Presupuestos, Historial, Parámetros)
 * y calcula saldos, deudas e inversiones con la MISMA lógica del bot (nodos Contexto/Reporte).
 * Desde la v5 también escribe, solo con lo que pide la página: corregir categoría o detalle de un movimiento,
 * registrar que alguien pagó (deuda suelta o cuotas de un préstamo) y deshacer eso. Cada escritura pasa por un
 * candado, se valida aquí (no en la página) y queda en Log Bot con Origen "Tablero".
 *
 * INSTALAR: en la hoja → Extensiones > Apps Script → crear los archivos Codigo.gs, Index.html y
 * appsscript.json con este contenido → Guardar → Implementar > Nueva implementación > App web
 * (Ejecutar como: Yo · Acceso: Solo yo). Instrucciones completas en README.md.
 */

// --- CONFIGURACIÓN ---
const ZONA = 'America/Bogota';
const ZONA_OFFSET_H = -5;            // solo para pruebas fuera de Google (Colombia no tiene horario de verano)
const MESES_HISTORIA = 12;           // meses de gastos e ingresos que se envían a la página
const MAX_MOVIMIENTOS = 3000;        // tope de movimientos enviados (los más recientes)
const HOJAS = {
  movimientos: 'Movimientos', cuentas: 'Cuentas', cuotasTarjeta: 'Cuotas tarjeta', personas: 'Personas',
  prestamos: 'Préstamos', cuotasPrestamo: 'Cuotas préstamo', activos: 'Activos', opsInversion: 'Operaciones inversión',
  presupuestos: 'Presupuestos', historial: 'Historial', parametros: 'Parámetros', categorias: 'Categorías'
};
const ENTRA = ['Ingreso', 'Préstamo recibido', 'Abono recibido', 'Cobro cuota', 'Ajuste', 'Venta reventa'];
const SALE = ['Gasto', 'Préstamo dado', 'Abono pagado', 'Transferencia', 'Pago tarjeta', 'Compra reventa'];
const DEST = ['Transferencia', 'Pago tarjeta'];

// --- PÁGINA ---
function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Mis finanzas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 Tablero')
    .addItem('Abrir tablero aquí', 'abrirTablero')
    .addItem('Ver enlace para el celular', 'verEnlace')
    .addToUi();
}

function abrirTablero() {
  const html = HtmlService.createTemplateFromFile('Index').evaluate().setWidth(1200).setHeight(820);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Mis finanzas');
}

function verEnlace() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(url ? 'Abre este enlace en el celular (solo funciona con tu cuenta de Google):\n\n' + url
    : 'Todavía no has implementado la app web. Ve a Implementar > Nueva implementación > App web.');
}

// --- DATOS (lo llama la página con google.script.run; debe ser pública, sin "_") ---
function getDatos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const T = {};
  for (const [k, nombre] of Object.entries(HOJAS)) {
    const sh = ss.getSheetByName(nombre);
    T[k] = sh ? filasDe_(sh.getDataRange().getValues()) : [];
  }
  return calcular(T, new Date());
}

/** Convierte una matriz (encabezados en la fila 1) en objetos por nombre de columna. */
function filasDe_(valores) {
  if (!valores.length) return [];
  const head = valores[0].map(h => String(h).trim());
  const out = [];
  for (let i = 1; i < valores.length; i++) {
    const o = { row_number: i + 1 };
    let algo = false;
    head.forEach((h, j) => { if (h) { o[h] = valores[i][j]; if (valores[i][j] !== '' && valores[i][j] !== null) algo = true; } });
    if (algo) out.push(o);
  }
  return out;
}

// --- CÁLCULO (puro: se prueba fuera de Google con los mismos datos) ---
/** Montos: acepta 25000, "25.000", "$ 25.000,50", "(3.797.362)" */
function num(v) {
  if (typeof v === 'number') return v;
  let s = String(v === undefined || v === null ? '' : v).trim();
  if (!s || s === '-') return 0;
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  s = s.replace(/[^\d,.]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : (neg ? -n : n);
}

/** Fecha → número de día (días desde 1970-01-01 en Bogotá). Acepta Date, número de serie de Sheets, "2026-09-29", "29/09/2026". NaN si no es fecha. */
function dia(v) {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return NaN;
    const s = (typeof Utilities !== 'undefined') ? Utilities.formatDate(v, ZONA, 'yyyy-MM-dd') : new Date(v.getTime() + ZONA_OFFSET_H * 3600e3).toISOString().slice(0, 10);
    return dia(s);
  }
  if (typeof v === 'number') return Math.floor(v) - 25569;
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return Math.round(Date.UTC(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]) / 864e5);
  return NaN;
}
function ymd(d) { return new Date(d * 864e5).toISOString().slice(0, 10); }
function partes(d) { const x = new Date(d * 864e5); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; }
function diaDe(y, m, d) { const fin = new Date(Date.UTC(y, m, 0)).getUTCDate(); return Math.round(Date.UTC(y, m - 1, Math.min(d, fin)) / 864e5); }
function mesDeDia(d) { return ymd(d).slice(0, 7); }
function sumarMeses(y, m, k) { const t = y * 12 + (m - 1) + k; return { y: Math.floor(t / 12), m: t % 12 + 1 }; }
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
function mesDe(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (v instanceof Date || typeof v === 'number') { const d = dia(v); return isNaN(d) ? '' : mesDeDia(d); }
  const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{1,2})/); if (m) return m[1] + '-' + m[2].padStart(2, '0');
  const d = dia(s); if (!isNaN(d)) return mesDeDia(d);
  m = s.match(/(\d{1,2})\/(\d{4})$/); return m ? m[2] + '-' + m[1].padStart(2, '0') : '';
}

function calcular(T, ahora) {
  const hoy = dia(ahora);
  // Hora del día como fracción (el interés del CDT se cuenta igual que en el bot: hasta este momento)
  const hhmm = (typeof Utilities !== 'undefined') ? Utilities.formatDate(ahora, ZONA, 'HH:mm') : new Date(ahora.getTime() + ZONA_OFFSET_H * 3600e3).toISOString().slice(11, 16);
  const ahoraDia = hoy + (+hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5)) / 1440;
  const movs = T.movimientos.filter(r => r.ID).map(r => Object.assign({}, r, { _dia: dia(r.Fecha), _monto: num(r.Monto) }));

  // Cuentas: saldo inicial + movimientos desde la fecha de saldo inicial (tarjeta = deuda; CDT con interés)
  const cuentas = T.cuentas.filter(c => c.ID).map(c => {
    const a = dia(c['Fecha saldo inicial']), desde = isNaN(a) ? -1e9 : a;
    const mv = movs.filter(r => !isNaN(r._dia) && r._dia >= desde);
    const sum = (campo, tipos) => mv.filter(r => String(r[campo]) === String(c.ID) && tipos.includes(r.Tipo)).reduce((s, r) => s + r._monto, 0);
    const ent = sum('Cuenta', ENTRA), sal = sum('Cuenta', SALE), dst = sum('Cuenta destino', DEST);
    const si = num(c['Saldo inicial']), tasa = num(c['Tasa EA']);
    let saldo;
    if (c.Tipo === 'Inversión') saldo = null;
    else if (c.Tipo === 'Tarjeta de crédito') saldo = si - ent + sal - dst;
    else if (c.Tipo === 'CDT') { const fin = dia(c['Fecha vencimiento']), hasta = !isNaN(fin) && fin < ahoraDia ? fin : ahoraDia;
      saldo = si * Math.pow(1 + tasa, Math.max(0, hasta - desde) / 365) + ent - sal + dst; }
    else saldo = si + ent - sal + dst;
    return { id: String(c.ID), nombre: c.Nombre, entidad: c.Entidad || '', tipo: c.Tipo, padre: c['Cuenta padre'] || '', activa: String(c.Activa || 'Sí') !== 'No',
      cupo: num(c.Cupo), pago: num(c['Día de pago']), saldo, vence: isNaN(dia(c['Fecha vencimiento'])) ? '' : ymd(dia(c['Fecha vencimiento'])) };
  });
  const cta = id => cuentas.find(c => c.id === String(id)) || {};

  // Tarjetas: próximo pago, mínimo (cuotas que vencen hasta esa fecha) y deuda total
  const ctasT = T.cuotasTarjeta.filter(r => r.ID);
  const ph = partes(hoy);
  const tarjetas = cuentas.filter(c => c.tipo === 'Tarjeta de crédito' && c.activa).map(c => {
    const d = c.pago || 10;
    let prox = diaDe(ph.y, ph.m, d);
    if (prox < hoy) { const s = sumarMeses(ph.y, ph.m, 1); prox = diaDe(s.y, s.m, d); }
    const pend = ctasT.filter(r => String(r.Cuenta) === c.id && !['Pagada', 'Anulada'].includes(r.Estado));
    const minimo = pend.filter(r => dia(r['Fecha de pago']) <= prox).reduce((s, r) => s + num(r['Valor cuota']), 0);
    const cuotasPend = pend.filter(r => !isNaN(dia(r['Fecha de pago']))).sort((a, b) => dia(a['Fecha de pago']) - dia(b['Fecha de pago']))
      .map(r => ({ fecha: ymd(dia(r['Fecha de pago'])), x: String(r.Comercio || 'Compra'), n: num(r['Nº']), de: num(r['Total cuotas']), valor: Math.round(num(r['Valor cuota'])), vencida: dia(r['Fecha de pago']) < hoy }));
    return { id: c.id, nombre: c.nombre, deuda: c.saldo || 0, cupo: c.cupo, disponible: c.cupo ? c.cupo - (c.saldo || 0) : null, prox: ymd(prox), minimo, cuotasPend };
  });

  // Personas: deuda suelta (Préstamo dado sin PR- menos abonos) + cuotas de préstamos; y lo que él debe
  const personas = T.personas.filter(p => p.Nombre);
  const prestamos = T.prestamos.filter(p => p.ID);
  const cuotasP = T.cuotasPrestamo.filter(q => q['ID préstamo']);
  const nombres = [...new Set([...personas.map(p => p.Nombre), ...movs.map(r => r.Persona).filter(Boolean), ...prestamos.map(p => p.Persona)])];
  const deudas = nombres.map(nombre => {
    const deP = movs.filter(r => norm(r.Persona) === norm(nombre));
    const dados = deP.filter(r => r.Tipo === 'Préstamo dado' && !String(r.Referencia || '').startsWith('PR-')).sort((x, y) => x._dia - y._dia);
    const abonos = deP.filter(r => r.Tipo === 'Abono recibido').reduce((s, r) => s + r._monto, 0);
    const informal = dados.reduce((s, r) => s + r._monto, 0) - abonos;
    const pendQ = cuotasP.filter(q => norm(q.Persona) === norm(nombre) && !['Pagada', 'Anulada'].includes(q.Estado));
    const cuotas = pendQ.reduce((s, q) => s + num(q['Valor cuota']) - num(q['Valor recibido']), 0);
    const yoDebo = deP.filter(r => r.Tipo === 'Préstamo recibido').reduce((s, r) => s + r._monto, 0) - deP.filter(r => r.Tipo === 'Abono pagado').reduce((s, r) => s + r._monto, 0);
    // Antigüedad de lo suelto: los abonos cubren primero lo más viejo; la fecha más vieja que sigue sin pagar
    let resto = abonos, desde = null;
    for (const r of dados) { if (resto >= r._monto - 0.5) { resto -= r._monto; continue; } desde = r._dia; break; }
    const p = personas.find(x => norm(x.Nombre) === norm(nombre)) || {};
    // Detalle (v2): qué le debe (cubierto por abonos de lo más viejo a lo más nuevo), abonos, préstamos con cuotas y lo que él le debe
    let cubre = abonos;
    const items = dados.map(r => { const pag = Math.max(0, Math.min(cubre, r._monto)); cubre -= pag;
      return { f: isNaN(r._dia) ? '' : ymd(r._dia), x: String(r.Detalle || r.Comercio || 'Préstamo'), m: Math.round(r._monto), c: cta(r.Cuenta).nombre || r.Cuenta || '', queda: Math.round(r._monto - pag),
        estado: pag >= r._monto - 0.5 ? 'pagado' : pag > 0.5 ? 'parcial' : 'pendiente' }; });
    const mv = r => ({ f: isNaN(r._dia) ? '' : ymd(r._dia), x: String(r.Detalle || r.Comercio || r.Tipo), m: Math.round(r._monto), c: cta(r.Cuenta).nombre || r.Cuenta || '' });
    const loans = prestamos.filter(pr => norm(pr.Persona) === norm(nombre)).map(pr => {
      const qs = cuotasP.filter(q => q['ID préstamo'] === pr.ID).sort((a, b) => num(a['Nº']) - num(b['Nº']));
      return { id: pr.ID, monto: Math.round(num(pr['Monto prestado'])), valor: Math.round(num(pr['Valor cuota'])), frecuencia: pr.Frecuencia || '', notas: String(pr.Notas || ''),
        cuotas: qs.map(q => ({ n: num(q['Nº']), fecha: isNaN(dia(q.Fecha)) ? '' : ymd(dia(q.Fecha)), valor: Math.round(num(q['Valor cuota'])), recibido: Math.round(num(q['Valor recibido'])),
          estado: q.Estado || 'Pendiente', vencida: !['Pagada', 'Anulada'].includes(q.Estado) && dia(q.Fecha) < hoy })) };
    });
    const detalle = { items: items.reverse(), abonos: deP.filter(r => r.Tipo === 'Abono recibido').sort((a, b) => b._dia - a._dia).map(mv),
      cobros: deP.filter(r => r.Tipo === 'Cobro cuota').sort((a, b) => b._dia - a._dia).map(mv), prestamos: loans,
      recibidos: deP.filter(r => r.Tipo === 'Préstamo recibido').sort((a, b) => b._dia - a._dia).map(mv), pagados: deP.filter(r => r.Tipo === 'Abono pagado').sort((a, b) => b._dia - a._dia).map(mv) };
    return { nombre, relacion: p['Relación'] || '', informal: Math.round(informal), cuotas: Math.round(cuotas), total: Math.round(informal + cuotas), yoDebo: Math.round(yoDebo),
      desde: informal > 0.5 && desde !== null && !isNaN(desde) ? ymd(desde) : '', dias: informal > 0.5 && desde !== null && !isNaN(desde) ? hoy - desde : null, detalle };
  });

  // Préstamos con cuotas y próximas cuotas por cobrar
  const resumenPrestamos = prestamos.map(p => {
    const qs = cuotasP.filter(q => q['ID préstamo'] === p.ID).sort((a, b) => num(a['Nº']) - num(b['Nº']));
    const pend = qs.filter(q => !['Pagada', 'Anulada'].includes(q.Estado));
    return { id: p.ID, persona: p.Persona, monto: num(p['Monto prestado']), n: qs.length, valor: num(p['Valor cuota']), pagadas: qs.length - pend.length, pendientes: pend.length,
      saldo: Math.round(pend.reduce((s, q) => s + num(q['Valor cuota']) - num(q['Valor recibido']), 0)) };
  });
  const cuotasProximas = cuotasP.filter(q => !['Pagada', 'Anulada'].includes(q.Estado) && !isNaN(dia(q.Fecha)) && dia(q.Fecha) <= hoy + 90)
    .map(q => ({ fecha: ymd(dia(q.Fecha)), persona: q.Persona, prestamo: q['ID préstamo'], n: num(q['Nº']), valor: Math.round(num(q['Valor cuota']) - num(q['Valor recibido'])), vencida: dia(q.Fecha) < hoy }))
    .filter(q => q.valor > 0).sort((a, b) => a.fecha < b.fecha ? -1 : 1);

  // Inversiones (precio en USD × dólar de Parámetros, costo promedio)
  const P = k => (T.parametros.find(r => r.Clave === k) || {}).Valor;
  const usdcop = num(P('usdcop_manual')) || 4000;
  const opsInv = T.opsInversion.filter(o => o.ID);
  const inversiones = T.activos.filter(a => a.Activo && String(a['Activo vigente'] || 'Sí') !== 'No').map(a => {
    const sim = String(a.Activo);
    const os = opsInv.filter(o => String(o.Activo).toUpperCase() === sim.toUpperCase()).sort((x, y) => dia(x.Fecha) - dia(y.Fecha));
    let cantidad = 0, costo = 0;
    for (const o of os) {
      const q = num(o.Cantidad), t = o['Tipo operación'], tcop = num(o['Total COP']);
      if (t === 'Saldo inicial' || t === 'Compra') { cantidad += q; costo += tcop || num(o['Total USD']) * usdcop; }
      else if (t === 'Venta') { const cu = cantidad ? costo / cantidad : 0; costo -= cu * q; cantidad -= q; }
      else if (t === 'Ajuste' || t === 'Recompensa') cantidad += q;
    }
    const valor = cantidad * num(a['Precio manual USD']) * usdcop;
    return { simbolo: sim, nombre: a.Nombre || sim, tipo: a['Tipo activo'] || 'Cripto', cuenta: cta(a.Cuenta).nombre || a.Cuenta || '', cantidad, valor: Math.round(valor), costo: Math.round(costo),
      ganancia: Math.round(valor - costo), pct: costo > 0 ? (valor - costo) / costo : null };
  }).filter(i => i.cantidad > 1e-9);

  // Totales (mismas fórmulas del resumen semanal)
  const disponible = cuentas.filter(c => c.activa && !['Tarjeta de crédito', 'Inversión', 'CDT'].includes(c.tipo) && c.saldo != null).reduce((s, c) => s + c.saldo, 0);
  const cdt = cuentas.filter(c => c.activa && c.tipo === 'CDT' && c.saldo != null).reduce((s, c) => s + c.saldo, 0);
  const inv = inversiones.reduce((s, i) => s + i.valor, 0);
  const deudaT = tarjetas.reduce((s, t) => s + (t.deuda || 0), 0);
  const meDeben = deudas.reduce((s, d) => s + Math.max(0, d.total), 0), yoDebo = deudas.reduce((s, d) => s + Math.max(0, d.yoDebo), 0);
  const patrimonio = disponible + inv + meDeben - deudaT - yoDebo;

  // Gastos e ingresos por mes y categoría (últimos meses)
  const desdeMes = (() => { const s = sumarMeses(ph.y, ph.m, -(MESES_HISTORIA - 1)); return s.y + '-' + String(s.m).padStart(2, '0'); })();
  const gastosMes = {}, ingresosMes = {}, ingresosCat = {}, entradasMes = {};
  for (const r of movs) {
    if (isNaN(r._dia)) continue;
    const mes = mesDeDia(r._dia); if (mes < desdeMes) continue;
    if (r.Tipo === 'Gasto') { const c = r['Categoría'] || 'Sin categoría'; (gastosMes[mes] = gastosMes[mes] || {})[c] = (gastosMes[mes][c] || 0) + r._monto; }
    if (['Ingreso', 'Venta reventa'].includes(r.Tipo)) {
      ingresosMes[mes] = (ingresosMes[mes] || 0) + r._monto;
      const c = r.Tipo === 'Venta reventa' ? 'Ventas de reventa' : (r['Categoría'] || 'Sin categoría');
      (ingresosCat[mes] = ingresosCat[mes] || {})[c] = (ingresosCat[mes][c] || 0) + r._monto;
    }
    // Plata que entró pero no es ingreso (le devolvieron o le prestaron); una deuda sin cuenta no movió plata
    if (['Abono recibido', 'Cobro cuota', 'Préstamo recibido'].includes(r.Tipo) && r.Cuenta) (entradasMes[mes] = entradasMes[mes] || {})[r.Tipo] = ((entradasMes[mes] || {})[r.Tipo] || 0) + r._monto;
  }
  const presupuestos = T.presupuestos.filter(p => p['Categoría']).map(p => ({ mes: mesDe(p.Mes), categoria: p['Categoría'], monto: num(p.Monto) })).filter(p => p.mes >= desdeMes);

  // Movimientos para la tabla (más recientes primero); el 4x1000 se agrupa como cualquier gasto
  const signo = t => ENTRA.includes(t) ? 1 : (DEST.includes(t) ? 0 : (SALE.includes(t) ? -1 : 0));
  const movimientos = movs.filter(r => !isNaN(r._dia)).sort((a, b) => b._dia - a._dia || String(b.ID).localeCompare(String(a.ID))).slice(0, MAX_MOVIMIENTOS)
    .map(r => ({ f: ymd(r._dia), t: r.Tipo, m: Math.round(r._monto), s: r.Tipo === 'Ajuste' ? (r._monto >= 0 ? 1 : -1) : signo(r.Tipo), c: cta(r.Cuenta).nombre || r.Cuenta || '',
      d: cta(r['Cuenta destino']).nombre || r['Cuenta destino'] || '', p: r.Persona || '', k: r['Categoría'] || '', x: String(r.Detalle || r.Comercio || ''),
      i: String(r.ID), dt: String(r.Detalle || ''), o: r.Origen || '' }));
  const categorias = {};
  for (const c of T.categorias.filter(c => c.Nombre && String(c.Activa || 'Sí') !== 'No')) (categorias[c.Tipo] = categorias[c.Tipo] || []).push(String(c.Nombre));

  const historial = T.historial.filter(h => !isNaN(dia(h.Fecha))).map(h => ({ fecha: ymd(dia(h.Fecha)), patrimonio: num(h['Patrimonio neto']), disponible: num(h['Efectivo y cuentas']),
    inversiones: num(h['Inversiones COP']), deudaTarjetas: num(h['Deuda tarjetas']), meDeben: num(h['Me deben']) })).sort((a, b) => a.fecha < b.fecha ? -1 : 1);

  const ahoraTxt = (typeof Utilities !== 'undefined') ? Utilities.formatDate(ahora, ZONA, 'yyyy-MM-dd HH:mm') : new Date(ahora.getTime() + ZONA_OFFSET_H * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  return {
    generado: ahoraTxt, hoy: ymd(hoy), mesActual: mesDeDia(hoy), usdcop,
    kpis: { disponible: Math.round(disponible), cdt: Math.round(cdt), inversiones: Math.round(inv), meDeben: Math.round(meDeben), deudaTarjetas: Math.round(deudaT), yoDebo: Math.round(yoDebo), patrimonio: Math.round(patrimonio) },
    cuentas: cuentas.filter(c => c.activa && c.tipo !== 'Tarjeta de crédito' && c.tipo !== 'Inversión').map(c => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, padre: c.padre, saldo: Math.round(c.saldo || 0), entidad: c.entidad, vence: c.vence })),
    tarjetas: tarjetas.map(t => ({ nombre: t.nombre, deuda: Math.round(t.deuda), cupo: t.cupo, disponible: t.disponible === null ? null : Math.round(t.disponible), prox: t.prox, minimo: Math.round(t.minimo), cuotas: t.cuotasPend })),
    inversiones: inversiones.sort((a, b) => b.valor - a.valor),
    deudores: deudas.filter(d => d.total > 0).sort((a, b) => b.total - a.total),
    acreedores: deudas.filter(d => d.yoDebo > 0).map(d => ({ nombre: d.nombre, monto: d.yoDebo, recibidos: d.detalle.recibidos, pagados: d.detalle.pagados })).sort((a, b) => b.monto - a.monto),
    prestamos: resumenPrestamos, cuotasProximas, categorias,
    cuentasCobro: cuentas.filter(c => c.activa && !['Tarjeta de crédito', 'Inversión', 'CDT'].includes(c.tipo)).map(c => ({ id: c.id, nombre: c.nombre, padre: c.padre })),
    bot: String(P('usuario_bot') || (typeof BOT_TELEGRAM !== 'undefined' ? BOT_TELEGRAM : '')).replace(/^@/, ''),
    gastosMes, ingresosMes, ingresosCat, entradasMes, presupuestos, movimientos, historial
  };
}

// --- CORRECCIONES DESDE EL TABLERO (v5) ---
// Escribe con el MISMO formato del bot (IDs MOV-/OP-, "Cuotas préstamo: ID=valor" en Comentarios, Log Bot),
// así /deshacer en Telegram también deshace un pago hecho aquí. Todo pasa por un candado y se valida en el servidor.
const BOT_TELEGRAM = 'AsistenteFinanzasWD_bot';   // se puede cambiar en Parámetros → usuario_bot
const TIPOS_CATEGORIA = ['Gasto', 'Ingreso'];
const CUENTAS_NO_COBRO = ['Tarjeta de crédito', 'Inversión', 'CDT'];

function ahoraTxt_(formato) {
  const d = new Date();
  if (typeof Utilities !== 'undefined') return Utilities.formatDate(d, ZONA, formato);
  const s = new Date(d.getTime() + ZONA_OFFSET_H * 3600e3).toISOString();   // pruebas en Node
  const p = { yy: s.slice(2, 4), yyyy: s.slice(0, 4), MM: s.slice(5, 7), dd: s.slice(8, 10), HH: s.slice(11, 13), mm: s.slice(14, 16), ss: s.slice(17, 19) };
  return formato.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, k => p[k]);
}
/** Igual que "Solicitudes" del bot: evita fórmulas y que un texto como "1/2" se vuelva fecha. */
function limpio_(v, col) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return v;
  const fechaCol = /^(Fecha|Creado|Modificado|Expira|Actualizado|Hora|Mes)/i.test(col || '');
  return (/^[=+@]/.test(v) || (!fechaCol && /^\d{1,2}[\/:-]\d{1,2}([\/-]\d{2,4})?$/.test(v.trim()))) ? "'" + v : v;
}
/** Una pestaña como tabla: encabezados, filas (con row_number), agregar, cambiar celdas y borrar. */
function tabla_(ss, nombre) {
  const sh = ss.getSheetByName(nombre);
  if (!sh) throw new Error('No encontré la pestaña "' + nombre + '".');
  const valores = sh.getDataRange().getValues();
  const head = (valores[0] || []).map(h => String(h).trim());
  return {
    head, filas: filasDe_(valores),
    agregar(obj) { sh.appendRow(head.map(h => limpio_(obj[h], h))); },
    cambiar(row, cambios) { for (const [c, v] of Object.entries(cambios)) { const j = head.indexOf(c); if (j >= 0) sh.getRange(row, j + 1).setValue(limpio_(v, c)); } },
    borrar(row) { sh.deleteRow(row); }
  };
}
function conCandado_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('La hoja está ocupada. Intenta de nuevo en unos segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function log_(ss, clave, accion, tablaN, idReg, datos, antes, nuevo) {
  tabla_(ss, 'Log Bot').agregar({ FechaHora: ahoraTxt_('yyyy-MM-dd HH:mm'), 'Run ID': clave, Origen: 'Tablero', 'ID mensaje': '', 'Acción': accion, Tabla: tablaN, 'ID registro': idReg,
    Resultado: 'OK', Error: '', 'Datos recibidos': JSON.stringify(datos).slice(0, 2000), 'Valor anterior': antes ? JSON.stringify(antes).slice(0, 2000) : '', 'Valor nuevo': nuevo });
}
function texto_(v, max) { return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
function claveOk_(c) { const s = String(c || ''); if (!/^[A-Za-z0-9]{8,40}$/.test(s)) throw new Error('Solicitud inválida (sin clave). Recarga la página.'); return s; }
function fechaPago_(v, hoy) {
  if (!v) return hoy;
  const s = String(v); if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(dia(s))) throw new Error('La fecha no es válida.');
  if (s > hoy) throw new Error('La fecha no puede ser futura.');
  return s;
}

/** Cambia categoría y/o detalle de un movimiento. p = { id, categoria, detalle, clave } */
function corregirMovimiento(p) {
  p = p || {}; const clave = claveOk_(p.clave);
  return conCandado_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const M = tabla_(ss, HOJAS.movimientos);
    const fila = M.filas.find(r => String(r.ID) === String(p.id || ''));
    if (!fila) throw new Error('No encontré ese movimiento; puede que lo hayan borrado. Recarga la página.');
    const cambios = {}, antes = {};
    if (p.categoria !== undefined && p.categoria !== null && p.categoria !== String(fila['Categoría'] || '')) {
      if (!TIPOS_CATEGORIA.includes(fila.Tipo)) throw new Error('Un movimiento de tipo ' + fila.Tipo + ' no lleva categoría.');
      const cats = tabla_(ss, HOJAS.categorias).filas.filter(c => c.Nombre && c.Tipo === fila.Tipo && String(c.Activa || 'Sí') !== 'No').map(c => String(c.Nombre));
      if (!cats.includes(String(p.categoria))) throw new Error('"' + p.categoria + '" no es una categoría de ' + fila.Tipo.toLowerCase() + ' activa.');
      cambios['Categoría'] = String(p.categoria); antes['Categoría'] = fila['Categoría'] || '';
    }
    if (p.detalle !== undefined && p.detalle !== null) {
      const det = texto_(p.detalle, 200);
      if (!det) throw new Error('El detalle no puede quedar vacío.');
      if (det !== String(fila.Detalle || '')) { cambios.Detalle = det; antes.Detalle = fila.Detalle || ''; }
    }
    if (!Object.keys(cambios).length) return { ok: true, sinCambios: true, datos: getDatos() };
    cambios.Modificado = ahoraTxt_('yyyy-MM-dd HH:mm');
    M.cambiar(fila.row_number, cambios);
    log_(ss, clave, 'corregir', HOJAS.movimientos, fila.ID, { id: fila.ID, categoria: p.categoria, detalle: p.detalle }, antes,
      Object.keys(antes).map(k => k + ': ' + (antes[k] || '—') + ' → ' + cambios[k]).join('; '));
    return { ok: true, mensaje: 'Corregí el movimiento.', deshacer: { tipo: 'corregir', id: fila.ID, antes }, datos: getDatos() };
  });
}

/** Registra que una persona pagó. p = { persona, destino: 'suelta' | ID de préstamo, monto, cuenta (ID), fecha, clave } */
function registrarPago(p) {
  p = p || {}; const clave = claveOk_(p.clave);
  return conCandado_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const M = tabla_(ss, HOJAS.movimientos);
    const ya = M.filas.find(r => String(r['Clave origen'] || '').indexOf('tablero_' + clave + '_') === 0);
    if (ya) return { ok: true, repetido: true, mensaje: 'Ese pago ya estaba registrado.', datos: getDatos() };
    const D = getDatos();
    const deudor = D.deudores.find(x => x.nombre === p.persona);
    if (!deudor) throw new Error((p.persona || 'Esa persona') + ' no te debe nada registrado.');
    const monto = Math.round(num(p.monto));
    if (!(monto > 0)) throw new Error('Escribe cuánto te pagó.');
    const cuentaF = tabla_(ss, HOJAS.cuentas).filas.find(c => String(c.ID) === String(p.cuenta || ''));
    if (!cuentaF || String(cuentaF.Activa || 'Sí') === 'No' || CUENTAS_NO_COBRO.includes(cuentaF.Tipo)) throw new Error('Elige la cuenta donde llegó la plata.');
    const hoy = ahoraTxt_('yyyy-MM-dd'), fecha = fechaPago_(p.fecha, hoy);
    const sello = ahoraTxt_('yyMMddHHmmss') + '-T' + clave.slice(0, 6), OP = 'OP-' + sello, creado = ahoraTxt_('yyyy-MM-dd HH:mm');
    let k = 0; const ids = [];
    const mov = m => { const id = 'MOV-' + sello + '-' + (++k); ids.push(id);
      M.agregar({ ID: id, 'Operación': OP, 'Clave origen': 'tablero_' + clave + '_' + k, Creado: creado, Modificado: creado, Fecha: fecha, Hora: '', Tipo: m.tipo, Monto: Math.round(m.monto), Moneda: 'COP',
        Cuenta: cuentaF.ID, 'Cuenta destino': '', Comercio: '', Persona: deudor.nombre, 'Categoría': m.categoria || '', Etiquetas: '', Detalle: m.detalle, Comentarios: m.comentarios || '',
        Referencia: m.ref || '', Cuotas: '', Tasa: '', Origen: 'Tablero', 'Link comprobante': '', 'ID documento': '', 'ID mensaje': '', 'Estado revisión': 'OK', 'ID extracto': '' }); };
    let resumen;
    if (p.destino === 'suelta') {
      if (deudor.informal <= 0) throw new Error(deudor.nombre + ' no tiene deuda suelta pendiente.');
      if (monto > deudor.informal + 1) throw new Error('Es más de lo que te debe suelto (' + pesos_(deudor.informal) + ').');
      mov({ tipo: 'Abono recibido', monto, detalle: 'Pago de ' + deudor.nombre });
      const queda = deudor.informal - monto;
      resumen = 'Registré ' + pesos_(monto) + ' de ' + deudor.nombre + ' a ' + cuentaF.Nombre + '. ' + (queda > 1 ? 'Le queda ' + pesos_(queda) + ' suelto.' : 'Ya no te debe nada suelto 🎉');
    } else {
      const pr = (deudor.detalle.prestamos || []).find(x => x.id === p.destino);
      if (!pr) throw new Error('Ese préstamo no es de ' + deudor.nombre + '.');
      const Q = tabla_(ss, HOJAS.cuotasPrestamo);
      const qs = Q.filas.filter(q => q['ID préstamo'] === pr.id && !['Pagada', 'Anulada'].includes(q.Estado)).sort((a, b) => num(a['Nº']) - num(b['Nº']));
      const saldo = qs.reduce((s, q) => s + num(q['Valor cuota']) - num(q['Valor recibido']), 0);
      if (saldo <= 0) throw new Error('El préstamo ' + pr.id + ' ya está pagado.');
      if (monto > Math.round(saldo) + 1) throw new Error('Es más de lo que falta del préstamo ' + pr.id + ' (' + pesos_(saldo) + ').');
      // Igual que "cobrar_cuota" del bot: reparte de la cuota más vieja a la más nueva, separando capital e interés
      let resto = monto, capital = 0, interes = 0; const nums = [], aplicado = [], idMov = 'MOV-' + sello + '-1';
      for (const q of qs) {
        if (resto <= 0) break;
        const v = num(q['Valor cuota']), rec = num(q['Valor recibido']), pend = v - rec, pago = Math.min(resto, pend);
        const cap = num(q.Capital) || v, parteCap = v ? pago * cap / v : pago;
        capital += parteCap; interes += pago - parteCap; resto -= pago;
        const completa = rec + pago >= v - 1;
        Q.cambiar(q.row_number, { 'Valor recibido': rec + pago, Estado: completa ? 'Pagada' : 'Pendiente', 'Fecha pago': completa ? fecha : '', 'Cuenta donde llegó': cuentaF.ID, 'ID movimiento': idMov });
        nums.push(completa ? String(q['Nº']) : q['Nº'] + ' (parcial)');
        aplicado.push(q.ID + '=' + Math.round(pago));
      }
      mov({ tipo: 'Cobro cuota', monto: capital, detalle: 'Cuota ' + nums.join(', ') + ' de ' + deudor.nombre, ref: pr.id, comentarios: 'Cuotas préstamo: ' + aplicado.join(';') });
      if (Math.round(interes) > 0) mov({ tipo: 'Ingreso', monto: interes, categoria: 'Intereses préstamos', detalle: 'Intereses cuota ' + nums.join(', ') + ' de ' + deudor.nombre, ref: pr.id });
      const queda = saldo - monto;
      resumen = 'Registré ' + pesos_(monto) + ' de ' + deudor.nombre + ' (cuota ' + nums.join(', ') + (Math.round(interes) > 0 ? ', ' + pesos_(interes) + ' de intereses' : '') + ') a ' + cuentaF.Nombre + '. ' +
        (queda > 1 ? 'Le quedan ' + pesos_(queda) + ' del préstamo.' : '¡Terminó de pagarte el préstamo! 🎉');
    }
    log_(ss, clave, 'cobrar_cuota', HOJAS.movimientos, ids.join(', '), { persona: deudor.nombre, destino: p.destino, monto, cuenta: cuentaF.ID, fecha }, null, resumen);
    return { ok: true, mensaje: resumen, deshacer: { tipo: 'pago', operacion: OP }, datos: getDatos() };
  });
}

/** Deshace un cambio hecho desde el tablero. p = { tipo: 'corregir', id, antes } | { tipo: 'pago', operacion }, más clave */
function deshacerCambio(p) {
  p = p || {}; const clave = claveOk_(p.clave);
  return conCandado_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const M = tabla_(ss, HOJAS.movimientos);
    if (p.tipo === 'corregir') {
      const fila = M.filas.find(r => String(r.ID) === String(p.id || ''));
      if (!fila) throw new Error('No encontré ese movimiento.');
      const cambios = {};
      for (const c of ['Categoría', 'Detalle']) if (p.antes && Object.prototype.hasOwnProperty.call(p.antes, c)) cambios[c] = texto_(p.antes[c], 200);
      if (!Object.keys(cambios).length) throw new Error('No hay nada que deshacer.');
      cambios.Modificado = ahoraTxt_('yyyy-MM-dd HH:mm');
      M.cambiar(fila.row_number, cambios);
      log_(ss, clave, 'deshacer', HOJAS.movimientos, fila.ID, p, null, 'Volvió a como estaba');
      return { ok: true, mensaje: 'Listo, quedó como estaba.', datos: getDatos() };
    }
    if (p.tipo === 'pago') {
      const op = String(p.operacion || '');
      const filas = M.filas.filter(r => r['Operación'] === op);
      if (!filas.length) return { ok: true, mensaje: 'Ese pago ya no estaba (quizá lo deshiciste desde Telegram).', datos: getDatos() };
      if (filas.some(r => r.Origen !== 'Tablero')) throw new Error('Solo puedo deshacer pagos registrados desde el tablero.');
      // Igual que /deshacer del bot: devuelve a cada cuota exactamente lo que se le aplicó
      const Q = tabla_(ss, HOJAS.cuotasPrestamo);
      for (const m of filas.filter(r => r.Tipo === 'Cobro cuota')) {
        const det = String(m.Comentarios || '').match(/Cuotas préstamo: (.+)/); if (!det) continue;
        for (const par of det[1].split(';')) {
          const [id, v] = par.split('='); const q = Q.filas.find(x => String(x.ID) === String(id).trim()); if (!q) continue;
          const queda = Math.max(0, Math.round(num(q['Valor recibido']) - num(v))), completa = queda >= num(q['Valor cuota']) - 1;
          Q.cambiar(q.row_number, Object.assign({ 'Valor recibido': queda || '', Estado: completa ? 'Pagada' : 'Pendiente', 'Fecha pago': completa ? (q['Fecha pago'] || '') : '' },
            queda ? {} : { 'Cuenta donde llegó': '', 'ID movimiento': '' }));
        }
      }
      filas.map(r => r.row_number).sort((a, b) => b - a).forEach(row => M.borrar(row));   // de abajo hacia arriba para no correr filas
      log_(ss, clave, 'deshacer', HOJAS.movimientos, filas.map(r => r.ID).join(', '), p, null, 'Borré el pago registrado desde el tablero');
      return { ok: true, mensaje: 'Listo, deshice ese pago.', datos: getDatos() };
    }
    throw new Error('No sé qué deshacer.');
  });
}
function pesos_(n) { return (n < 0 ? '-$' : '$') + String(Math.abs(Math.round(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

// Para las pruebas fuera de Google (Node); en Apps Script no hace nada
if (typeof module !== 'undefined') module.exports = { calcular, filasDe_, num, dia, ymd, getDatos, corregirMovimiento, registrarPago, deshacerCambio, limpio_ };
