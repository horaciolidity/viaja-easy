import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { downloadPDFReport, downloadCSVReport } from '@/utils/reportUtils.js';
import { fetchDataForReport, buildSummaryForReport } from '@/utils/reportDataUtils.js';
import ReportFilters from '@/components/admin/reports/ReportFilters';
import ReportSummary from '@/components/admin/reports/ReportSummary';
import ReportTable from '@/components/admin/reports/ReportTable';
import ReportActions from '@/components/admin/reports/ReportActions';

const LOGO_URL =
  'https://wlssatbhutozvryrejzv.supabase.co/storage/v1/object/public/logo/logo_2732x2732__1_-removebg-preview.png';

export default function AdminReportsPage() {
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    reportType: 'ingresos',      // ingresos | conductores | pasajeros | viajes_completados | viajes_cancelados | total
    rideLabel: 'all',            // all | inmediato | programado | por_hora | paqueteria | compartido
    dateRange: { from: '', to: '' },
    rideId: '',
    userId: '',
    userRole: 'passenger',       // se usa sólo cuando viene userId explícito
    userEmail: '',               // si hay email, se ignora userRole y busca en passenger_id y driver_id
  });

  const [reportData, setReportData] = useState({
    rows: [],
    summary: {},
    profiles: [],
    documents: [],
  });

  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    const { from, to } = filters.dateRange || {};
    if (!from || !to) {
      toast({
        title: 'Error',
        description: 'Selecciona un rango de fechas.',
        variant: 'destructive',
      });
      return;
    }
    if (new Date(from) > new Date(to)) {
      toast({
        title: 'Rango inválido',
        description: 'La fecha "Desde" no puede ser mayor que "Hasta".',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setReportData({ rows: [], summary: {}, profiles: [], documents: [] });

    try {
      const data = await fetchDataForReport(filters);
      const summary = buildSummaryForReport(data.rows, filters.reportType);

      setReportData({
        rows: data.rows,
        summary,
        profiles: data.profiles,
        documents: data.documents,
      });

      toast({
        title: 'Reporte generado',
        description: `Se encontraron ${(data.rows || []).length} registro(s).`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo generar el reporte.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // <-- CORREGIDO: usar async/await y formato explícito 'csv' | 'pdf'
  const handleDownload = async (format) => {
    try {
      const downloadData = {
        ...filters,
        ...reportData,
        logoUrl: LOGO_URL,
      };

      if (format === 'csv') {
        downloadCSVReport(downloadData);
      } else if (format === 'pdf') {
        await downloadPDFReport(downloadData);
      } else {
        throw new Error('Formato de descarga no soportado');
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo generar el archivo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-xl p-6 space-y-8"
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-1">Generación de Reportes</h2>
        <p className="text-sm text-slate-500">
          Filtrá por fechas, tipo de viaje, viaje puntual o usuario. Descargá CSV o PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border border-slate-200 rounded-lg bg-slate-50/70">
        <ReportFilters filters={filters} setFilters={setFilters} />
        <ReportActions
          onGenerate={handleGenerateReport}
          onDownload={handleDownload}
          loading={loading}
          hasData={reportData.rows.length > 0}
        />
      </div>

      {reportData.rows.length > 0 && (
        <div className="p-6 border border-slate-200 rounded-lg">
          <ReportSummary summary={reportData.summary} rowCount={reportData.rows.length} />
          <ReportTable rows={reportData.rows} />
        </div>
      )}
    </motion.div>
  );
}
