/**
 * Tablero de finanzas - app web en vivo sobre la hoja de finanzas
 *
 * Lee las pestañas que usa el bot de Telegram (Movimientos, Cuentas, Cuotas tarjeta, Personas,
 * Préstamos, Cuotas préstamo, Activos, Operaciones inversión, Presupuestos, Historial, Parámetros)
 * y calcula saldos, deudas e inversiones con la MISMA lógica del bot (nodos Contexto/Reporte).
 * No escribe nada en la hoja.
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
  const gastosMes = {}, ingresosMes = {};
  for (const r of movs) {
    if (isNaN(r._dia)) continue;
    const mes = mesDeDia(r._dia); if (mes < desdeMes) continue;
    if (r.Tipo === 'Gasto') { const c = r['Categoría'] || 'Sin categoría'; (gastosMes[mes] = gastosMes[mes] || {})[c] = (gastosMes[mes][c] || 0) + r._monto; }
    if (['Ingreso', 'Venta reventa'].includes(r.Tipo)) ingresosMes[mes] = (ingresosMes[mes] || 0) + r._monto;
  }
  const presupuestos = T.presupuestos.filter(p => p['Categoría']).map(p => ({ mes: mesDe(p.Mes), categoria: p['Categoría'], monto: num(p.Monto) })).filter(p => p.mes >= desdeMes);

  // Movimientos para la tabla (más recientes primero); el 4x1000 se agrupa como cualquier gasto
  const signo = t => ENTRA.includes(t) ? 1 : (DEST.includes(t) ? 0 : (SALE.includes(t) ? -1 : 0));
  const movimientos = movs.filter(r => !isNaN(r._dia)).sort((a, b) => b._dia - a._dia || String(b.ID).localeCompare(String(a.ID))).slice(0, MAX_MOVIMIENTOS)
    .map(r => ({ f: ymd(r._dia), t: r.Tipo, m: Math.round(r._monto), s: r.Tipo === 'Ajuste' ? (r._monto >= 0 ? 1 : -1) : signo(r.Tipo), c: cta(r.Cuenta).nombre || r.Cuenta || '',
      d: cta(r['Cuenta destino']).nombre || r['Cuenta destino'] || '', p: r.Persona || '', k: r['Categoría'] || '', x: String(r.Detalle || r.Comercio || '') }));

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
    prestamos: resumenPrestamos, cuotasProximas,
    gastosMes, ingresosMes, presupuestos, movimientos, historial
  };
}

// Para las pruebas fuera de Google (Node); en Apps Script no hace nada
if (typeof module !== 'undefined') module.exports = { calcular, filasDe_, num, dia, ymd };
