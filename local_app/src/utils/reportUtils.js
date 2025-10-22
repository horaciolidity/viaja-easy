import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SUPABASE_URL = 'https://wlssatbhutozvryrejzv.supabase.co';
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/logo/logo_2732x2732__1_-removebg-preview.png`;

// Avatares: soporta /avatars/<id>/{avatar,profile}.{png,jpg} y /avatars/avatars/...
const DEFAULT_AVATAR_CANDIDATES = [
  `${SUPABASE_URL}/storage/v1/object/public/avatars/default-avatar.png`,
  `${SUPABASE_URL}/storage/v1/object/public/avatars/avatars/default-avatar.png`,
  `${SUPABASE_URL}/storage/v1/object/public/avatars/default.png`,
  `${SUPABASE_URL}/storage/v1/object/public/avatars/avatars/default.png`,
];

// PNG 1x1 transparente: último fallback
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMD/QtYv5cAAAAASUVORK5CYII=';

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
    .format(Number(n || 0));

/* --------------------------- Helpers genéricos --------------------------- */
async function fetchAsDataURL(url) {
  if (!url) return null;
  if (typeof url === 'string' && url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function fetchFirstAsDataURL(urls = []) {
  for (const u of urls.filter(Boolean)) {
    const data = await fetchAsDataURL(u);
    if (data) return data;
  }
  return null;
}

function bothAvatarPublicUrlsForPath(path) {
  if (!path) return [];
  const s = String(path).trim();
  if (/^https?:\/\//i.test(s)) return [s];
  if (s.includes('/storage/v1/object/public/')) {
    const full = `${SUPABASE_URL}${s.startsWith('/') ? '' : '/'}${s}`;
    return [full];
  }
  const clean = s.replace(/^public\//, '').replace(/^avatars\//, '');
  return [
    `${SUPABASE_URL}/storage/v1/object/public/avatars/${clean}`,
    `${SUPABASE_URL}/storage/v1/object/public/avatars/avatars/${clean}`,
  ];
}

function guessAvatarUrlsById(id) {
  if (!id) return [];
  const files = ['profile.png', 'profile.jpg', 'avatar.png', 'avatar.jpg'];
  const bases = [
    `${SUPABASE_URL}/storage/v1/object/public/avatars/${id}`,
    `${SUPABASE_URL}/storage/v1/object/public/avatars/avatars/${id}`,
  ];
  const urls = [];
  for (const b of bases) for (const f of files) urls.push(`${b}/${f}`);
  return urls;
}

function buildAvatarCandidates(profile = {}) {
  const out = [];
  if (profile.generated_avatar_public_url) out.push(profile.generated_avatar_public_url);
  if (profile.generated_public_url) out.push(profile.generated_public_url);
  if (profile.avatar_url) out.push(...bothAvatarPublicUrlsForPath(profile.avatar_url));
  if (profile.avatar_path) out.push(...bothAvatarPublicUrlsForPath(profile.avatar_path));
  if (profile.id) out.push(...guessAvatarUrlsById(profile.id));
  out.push(...DEFAULT_AVATAR_CANDIDATES, TRANSPARENT_PX);
  return out;
}

function shortText(s = '', n = 70) {
  const str = String(s);
  return str.length > n ? str.slice(0, n - 3) + '...' : str;
}

function pickRowDate(r) {
  return (
    r.finished_at ||
    r.completed_at ||
    r.cancelled_at ||
    r.ended_at ||
    r.start_datetime ||
    r.started_at ||
    r.scheduled_pickup_time ||
    r.departure_time ||
    r.created_at ||
    null
  );
}

/* ------------------------- Documentos (miniaturas) ------------------------- */
const IMG_EXT_RE = /\.(png|jpg|jpeg|webp|gif)$/i;

function pickDocPublicUrl(d) {
  return d?.generated_public_url || d?.file_url || null;
}

function isImageUrl(u = '') {
  return IMG_EXT_RE.test(String(u));
}

/* ------------------------------- PDF report ------------------------------- */
export async function downloadPDFReport(report) {
  const {
    reportType, rideLabel, dateRange, rideId, userId, userRole,
    rows, summary, profiles = [], documents = [],
    logoUrl = LOGO_URL,
  } = report;

  if (!rows?.length) return;

  // *** LANDSCAPE ***
  const doc = new jsPDF('l', 'pt', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;

  // Header
  const logo = await fetchAsDataURL(logoUrl);
  if (logo) {
    try { doc.addImage(logo, 'PNG', marginX, 22, 120, 36); } catch { }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Informe Oficial - ViajaFácil', pageW / 2, 40, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const filtersLine = [
    `Tipo reporte: ${reportType.replace('_', ' ')}`,
    `Tipo viaje: ${rideLabel}`,
    `Periodo: ${dateRange.from} a ${dateRange.to}`,
    rideId ? `ID Viaje: ${rideId}` : '',
    userId ? `ID Usuario (${userRole}): ${userId}` : '',
  ].filter(Boolean).join('   •   ');
  doc.text(filtersLine, pageW / 2, 58, { align: 'center' });

  // Tabla principal
  const body = rows.map((r) => [
    (pickRowDate(r) ? new Date(pickRowDate(r)).toLocaleString('es-AR') : '-'),
    r.ride_label,
    r.status,
    r.origin_address || '-',
    r.destination_address || '-',
    r.passenger_name || (r.passenger_id ? String(r.passenger_id).slice(0, 8) : '-'),
    r.driver_name || (r.driver_id ? String(r.driver_id).slice(0, 8) : '-'),
    fmtARS(r.app_earnings),
    fmtARS(r.driver_earnings),
    fmtARS(r.fare_paid ?? r.total_amount),
  ]);

  autoTable(doc, {
    startY: 80,
    head: [[
      'Fecha', 'Tipo', 'Estado', 'Origen', 'Destino',
      'Pasajero', 'Conductor', 'App $', 'Driver $', 'Pagado $',
    ]],
    body,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      const str = `Página ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.text(str, pageW / 2, pageH - 18, { align: 'center' });
    },
  });

  let y = doc.lastAutoTable.finalY + 16;

  // Resumen
  if (summary && Object.keys(summary).length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(summary.titulo || 'Resumen', marginX, y); y += 14;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);

    if ('totalIngresos' in summary) {
      doc.text(`Total ingresos (App): ${fmtARS(summary.totalIngresos)}`, marginX, y); y += 12;
      doc.text(`Total viajes: ${summary.totalViajes}`, marginX, y); y += 12;
      doc.text(`Promedio por viaje: ${fmtARS(summary.promedioPorViaje)}`, marginX, y); y += 12;
      if ('totalPagado' in summary || 'totalDriver' in summary) {
        if ('totalPagado' in summary) { doc.text(`Total pagado por pasajeros: ${fmtARS(summary.totalPagado)}`, marginX, y); y += 12; }
        if ('totalDriver' in summary) { doc.text(`Total pagado a conductores: ${fmtARS(summary.totalDriver)}`, marginX, y); y += 12; }
      }
      y += 6;
    }

    if (Array.isArray(summary.agregados) && summary.agregados.length) {
      const isDrivers = reportType === 'conductores';
      const head = isDrivers
        ? [['Conductor', 'Teléfono', 'Viajes', 'App $', 'Driver $']]
        : [['Pasajero', 'Teléfono', 'Viajes', 'Gasto $']];
      const bodyAgg = summary.agregados.map((a) =>
        isDrivers
          ? [a.driver_name, a.driver_phone || '-', String(a.viajes), fmtARS(a.app_earnings), fmtARS(a.driver_earnings)]
          : [a.passenger_name, a.passenger_phone || '-', String(a.viajes), fmtARS(a.gasto)]
      );

      autoTable(doc, {
        startY: y + 6,
        head,
        body: bodyAgg,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: marginX, right: marginX },
      });
      y = doc.lastAutoTable.finalY + 12;
    }
  }

  // Perfil (si filtraste por usuario)
  if (profiles.length) {
    const p = profiles[0];
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Perfil del Usuario', marginX, y); y += 8;

    const avatarCandidates = buildAvatarCandidates(p);
    const avatarData = await fetchFirstAsDataURL(avatarCandidates);
    try {
      doc.addImage(avatarData || TRANSPARENT_PX, 'PNG', marginX, y + 6, 60, 60);
    } catch { }

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const left = marginX + 70;
    const lines = [
      `Nombre: ${p.full_name || '-'}`,
      `Email: ${p.email || '-'}`,
      `Teléfono: ${p.phone || '-'}`,
      `Rol: ${p.user_type || '-'}`,
      `Verificado: ${p.verified ? 'Sí' : 'No'}`,
      `Calificación: ${p.rating ?? '-'}`,
      `Viajes completados: ${p.total_completed_rides ?? '-'}`,
      `Miembro desde: ${p.member_since ? new Date(p.member_since).toLocaleString('es-AR') : '-'}`,
    ];
    lines.forEach((t, i) => doc.text(t, left, y + 18 + (i * 12)));
    y += 18 + (lines.length * 12) + 10;
  }

  // ---------------- Documentación: miniaturas + click para ampliar ----------------
  if (Array.isArray(documents) && documents.length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Documentación presentada', marginX, y); y += 10;

    const head = [['Tipo', 'Estado', 'Vence', 'Vista']];
    const thumbs = [];     // dataURL miniatura o transparente
    const fullImgs = [];   // dataURL completa (para ampliar) o null
    const isImg = [];      // bool para saber si se puede ampliar
    const bodyDocs = [];

    for (const d of documents) {
      const url = pickDocPublicUrl(d);
      const imageLike = isImageUrl(url);
      isImg.push(imageLike);

      let full = null;
      if (imageLike) full = await fetchAsDataURL(url);
      fullImgs.push(full);

      // miniatura = full o transparente
      thumbs.push(full || TRANSPARENT_PX);

      bodyDocs.push([
        String(d.doc_type || d.kind || '-'),
        String(d.status || '-'),
        d.expires_at ? new Date(d.expires_at).toLocaleDateString('es-AR') : '-',
        '' // columna de miniatura
      ]);
    }

    // parámetros de miniaturas
    const TH_W = 90;
    const TH_H = 68;

    // registro de rectángulos de miniaturas para linkear luego
    const thumbRects = []; // { page, x, y, w, h, idx }

    autoTable(doc, {
      startY: y + 6,
      head,
      body: bodyDocs,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: marginX, right: marginX },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          // algunos builds no exponen data.cell; chequeo defensivo
          if (!data.cell || typeof data.cell.x !== 'number') return;
          const i = data.row.index;
          const img = thumbs[i];

          const x = data.cell.x + (data.cell.width - TH_W) / 2;
          const y2 = data.cell.y + (data.cell.height - TH_H) / 2;
          try { doc.addImage(img, 'PNG', x, y2, TH_W, TH_H); } catch { }

          // si hay imagen grande, guardamos rect para link interno
          if (isImg[i] && fullImgs[i]) {
            const pageInfo = doc.getCurrentPageInfo
              ? doc.getCurrentPageInfo().pageNumber
              : doc.internal.getNumberOfPages();
            thumbRects.push({ page: pageInfo, x, y: y2, w: TH_W, h: TH_H, idx: i });
          }
        }
      }
    });

    y = doc.lastAutoTable.finalY + 10;

    // crear páginas con la imagen grande
    const bigPageForIndex = {}; // idx -> pageNumber
    for (let i = 0; i < fullImgs.length; i++) {
      if (!isImg[i] || !fullImgs[i]) continue;

      doc.addPage();
      const targetPage = doc.internal.getNumberOfPages();
      bigPageForIndex[i] = targetPage;

      const PAD = 40;
      const maxW = pageW - PAD * 2;
      const maxH = pageH - PAD * 2;

      try {
        const props = doc.getImageProperties(fullImgs[i]);
        const ratio = Math.min(maxW / props.width, maxH / props.height);
        const dw = props.width * ratio;
        const dh = props.height * ratio;
        const px = (pageW - dw) / 2;
        const py = (pageH - dh) / 2;

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('Vista ampliada', PAD, 28);
        doc.addImage(fullImgs[i], 'PNG', px, py, dw, dh, undefined, 'FAST');
      } catch {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('Vista ampliada (no disponible)', PAD, 28);
      }
    }

    // agregar enlaces desde las miniaturas a su página grande
    for (const r of thumbRects) {
      const target = bigPageForIndex[r.idx];
      if (!target) continue;
      doc.setPage(r.page);
      doc.link(r.x, r.y, r.w, r.h, { pageNumber: target });
    }
  }

  const fname = `reporte_${reportType}_${rideLabel}_${dateRange.from}_${dateRange.to}.pdf`;
  doc.save(fname);
}

/* --------------------------------- CSV --------------------------------- */
export function downloadCSVReport(report) {
  const { reportType, rideLabel, dateRange, rows } = report;
  if (!rows?.length) return;

  const headers = [
    'ride_table',
    'ride_id',
    'ride_label',
    'status',
    'payment_method',
    'payment_status',
    'created_at',
    'started_at',
    'finished_at',
    'origin_address',
    'destination_address',
    'passenger_id',
    'passenger_name',
    'passenger_phone',
    'driver_id',
    'driver_name',
    'driver_phone',
    'app_earnings',
    'driver_earnings',
    'fare_paid',
    'total_amount',
  ];

  const csv =
    [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => r[h] ?? '')
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${reportType}_${rideLabel}_${dateRange.from}_${dateRange.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
