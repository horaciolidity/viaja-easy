// src/components/admin/reports/ReportActions.jsx
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BarChartBig, Download, FileText } from 'lucide-react';

export default function ReportActions({ onGenerate, onDownload, loading, hasData }) {
  return (
    <div className="md:col-span-3 flex flex-wrap gap-2 justify-end mt-2">
      <Button onClick={onGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
          />
        ) : (
          <BarChartBig className="w-5 h-5 mr-2" />
        )}
        {loading ? 'Generando...' : 'Generar Reporte'}
      </Button>

      <Button variant="outline" onClick={() => onDownload('csv')} disabled={!hasData}>
        <Download className="w-4 h-4 mr-2" />
        Descargar CSV
      </Button>

      {/* OJO: aquí 'pdf' en minúsculas */}
      <Button variant="outline" onClick={() => onDownload('pdf')} disabled={!hasData}>
        <FileText className="w-4 h-4 mr-2" />
        Descargar PDF
      </Button>
    </div>
  );
}
