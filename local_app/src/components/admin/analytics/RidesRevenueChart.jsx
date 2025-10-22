import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Car, DollarSign } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/90 border border-slate-200 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-slate-700">{label}</p>
        <p className="text-indigo-600">{`Viajes: ${payload[0].value}`}</p>
        <p className="text-emerald-600">{`Ingresos: ${formatCurrencyARS(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

const RidesRevenueChart = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="shadow-lg col-span-1 lg:col-span-2 h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center"><Car className="mr-2 h-5 w-5" /> Viajes e Ingresos Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center"><Car className="mr-2 h-5 w-5" /> Viajes e Ingresos Diarios</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="metric_date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              tick={{ fontSize: 12 }} 
            />
            <YAxis yAxisId="rides" orientation="left" stroke="#4f46e5" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="revenue" orientation="right" stroke="#10b981" tickFormatter={(value) => `$${(value / 1000)}k`} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Bar yAxisId="revenue" dataKey="total_revenue" name="Ingresos" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
            <Line yAxisId="rides" type="monotone" dataKey="ride_count" name="Viajes" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RidesRevenueChart;