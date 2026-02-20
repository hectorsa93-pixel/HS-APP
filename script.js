let ventas = JSON.parse(localStorage.getItem('HS_ELITE_FINAL')) || [];
const { jsPDF } = window.jspdf;

// Splash Screen
window.addEventListener('load', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('v-fecha').value = hoy;
    document.getElementById('a-fecha-pago').value = hoy;
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 1000);
    }, 2000);
});

// Navegación
function navegar(p) {
    document.querySelectorAll('.app-panel, #home-screen').forEach(s => s.style.display = 'none');
    if(p === 'home') {
        document.getElementById('home-screen').style.display = 'flex';
    } else {
        document.getElementById('panel-' + p).style.display = 'block';
        if(p === 'abonos') cargarClientesAbono();
        if(p === 'consulta') mostrarVentas();
    }
}

// --- Gestión de Abonos y Tickets ---
function registrarAbono() {
    const id = document.getElementById('a-cliente-select').value;
    const m = parseFloat(document.getElementById('a-monto').value);
    const f = document.getElementById('a-fecha-pago').value;
    
    if(!id || isNaN(m) || m <= 0) return alert('Verifique los datos de abono.');
    
    const v = ventas.find(x => x.id == id);
    v.historialPagos.push({fecha: f, monto: m});
    localStorage.setItem('HS_ELITE_FINAL', JSON.stringify(ventas));
    
    generarTicketElegante(v, m, f);
    document.getElementById('a-monto').value = '';
    actualizarInfoAbono();
}

function generarTicketElegante(v, m, f) {
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
    const cuota = v.costo / v.plan;
    const pagadoTotal = v.historialPagos.reduce((a, b) => a + b.monto, 0);

    // Header Logo
    doc.setDrawColor(197, 160, 89); doc.rect(25, 10, 30, 12);
    doc.setFont("times", "bold"); doc.setFontSize(18); doc.text("HS", 40, 19, {align:'center'});
    doc.setFontSize(7); doc.text("BOUTIQUE & CO.", 40, 25, {align:'center'});
    
    doc.line(5, 30, 75, 30);
    doc.setFontSize(8); doc.text(`CLIENTE: ${v.cliente.toUpperCase()}`, 5, 40);
    doc.text(`FECHA: ${f}`, 5, 50);
    doc.line(5, 55, 75, 55);
    
    doc.setFontSize(10); doc.text("ABONADO:", 5, 65); doc.text(`$${m.toFixed(2)}`, 75, 65, {align:'right'});
    doc.text("RESTANTE:", 5, 73); doc.text(`$${(v.costo - pagadoTotal).toFixed(2)}`, 75, 73, {align:'right'});
    
    // NOTAS PERSONALIZADAS
    doc.setFontSize(7);
    if (m >= (cuota - 0.1)) {
        doc.setTextColor(16, 101, 52);
        doc.text(doc.splitTextToSize(`FELICITACIONES AL CLIENTE POR CUBRIR LA CANTIDAD FIJADA EN SU PLAN.`, 65), 40, 85, {align:'center'});
    } else {
        doc.setTextColor(185, 28, 28);
        doc.text(doc.splitTextToSize(`SEGUIMOS ESPERANDO SU ESTABILIDAD ECONOMICA PARA NO TENER PROBLEMAS FINANCIEROS FUTUROS.`, 65), 40, 85, {align:'center'});
    }
    
    doc.setTextColor(0); doc.text("__________________________", 40, 120, {align:'center'});
    doc.text("FIRMA DE RECIBIDO", 40, 125, {align:'center'});
    doc.save(`Ticket_${v.cliente}.pdf`);
}

// --- Generación de Estado de Cuenta A4 ---
function generarReporteA4(id) {
    const v = ventas.find(x => x.id === id);
    const doc = new jsPDF();
    const pagadoTotal = v.historialPagos.reduce((a, b) => a + b.monto, 0);
    const cuotaSugerida = v.costo / v.plan;

    // Logo Formal enmarcado
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 45, 'F');
    doc.setDrawColor(197, 160, 89); doc.setLineWidth(1); doc.rect(20, 10, 25, 25);
    doc.setTextColor(255); doc.setFont("times", "bold"); doc.setFontSize(24); doc.text("HS", 32.5, 27, {align:'center'});
    doc.setFontSize(10); doc.text("BOUTIQUE & CO.", 20, 40);
    doc.setFontSize(18); doc.text("ESTADO DE CUENTA", 130, 25);

    doc.setTextColor(0); doc.setDrawColor(197, 160, 89); doc.line(20, 62, 190, 62);
    doc.setFontSize(10); doc.text(`CLIENTE: ${v.cliente.toUpperCase()}`, 20, 70);
    doc.text(`PRODUCTO: ${v.producto.toUpperCase()}`, 20, 76);
    doc.text(`VALOR VENTA: $${v.costo.toFixed(2)}`, 20, 82);
    doc.setFont("helvetica", "bold"); doc.text(`SALDO PENDIENTE: $${(v.costo - pagadoTotal).toFixed(2)}`, 130, 70);

    // Tabla de Historial
    doc.autoTable({
        head: [['#', 'FECHA PAGO', 'MONTO', 'CALIFICACIÓN']],
        body: v.historialPagos.map((p, i) => [i+1, p.fecha, `$${p.monto.toFixed(2)}`, p.monto >= cuotaSugerida-0.1 ? 'CUMPLIDO' : 'PARCIAL']),
        startY: 95, headStyles: { fillColor: [15, 23, 42] }, theme: 'grid'
    });

    // Firmas
    const fY = doc.lastAutoTable.finalY + 40;
    doc.line(40, fY, 90, fY); doc.text("FIRMA CLIENTE", 65, fY + 5, {align:'center'});
    doc.line(120, fY, 170, fY); doc.text("HS BOUTIQUE & CO.", 145, fY + 5, {align:'center'});

    doc.save(`Estado_${v.cliente}.pdf`);
}

// Funciones Auxiliares (Buscador, Modales, etc) se mantienen...
function filtrarVentas() {
    const f = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('#tabla-body tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(f) ? '' : 'none';
    });
}

function mostrarVentas() {
    const tbody = document.getElementById('tabla-body'); tbody.innerHTML = '';
    ventas.forEach(v => {
        const pagado = v.historialPagos.reduce((a, b) => a + b.monto, 0);
        tbody.innerHTML += `<tr><td>${v.fecha}</td><td><b>${v.cliente}</b></td><td>$${(v.costo-pagado).toFixed(2)}</td>
        <td><button class="btn-main" onclick="generarReporteA4(${v.id})">PDF</button></td></tr>`;
    });
}

function cargarClientesAbono() {
    const s = document.getElementById('a-cliente-select');
    s.innerHTML = '<option value="">Seleccione...</option>';
    ventas.forEach(v => { s.innerHTML += `<option value="${v.id}">${v.cliente}</option>`; });
}

function actualizarInfoAbono() {
    const id = document.getElementById('a-cliente-select').value;
    const btn = document.getElementById('btn-abrir-edit');
    const cont = document.getElementById('detalle-abono-container');
    if(!id) { cont.style.display='none'; btn.style.display='none'; return; }
    btn.style.display='block'; cont.style.display='block';
    const v = ventas.find(x => x.id == id);
    const pagado = v.historialPagos.reduce((a, b) => a + b.monto, 0);
    document.getElementById('tabla-detalle-abono').innerHTML = `
        <tr><td>PRODUCTO</td><td>${v.producto}</td></tr>
        <tr><td>VALOR</td><td>$${v.costo.toFixed(2)}</td></tr>
        <tr><td>SALDO</td><td style="color:var(--error);font-weight:700">$${(v.costo-pagado).toFixed(2)}</td></tr>`;
}

document.getElementById('formVenta').onsubmit = (e) => {
    e.preventDefault();
    ventas.push({
        id: Date.now(),
        fecha: document.getElementById('v-fecha').value,
        cliente: document.getElementById('v-cliente').value.trim(),
        producto: document.getElementById('v-producto').value,
        costo: parseFloat(document.getElementById('v-costo').value),
        plan: parseInt(document.getElementById('v-plan').value),
        historialPagos: []
    });
    localStorage.setItem('HS_ELITE_FINAL', JSON.stringify(ventas));
    alert('Venta guardada.'); navegar('home');
};
