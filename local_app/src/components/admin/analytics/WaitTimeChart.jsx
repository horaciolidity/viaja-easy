import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/90 border border-slate-200 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-slate-700">{new Date(label).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}</p>
        <p className="text-orange-600">{`Espera promedio: ${payload[0].value} min`}</p>
      </div>
    );
  }
  return null;
};

const WaitTimeChart = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="shadow-lg h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Tiempo de Espera Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Tiempo de Espera Promedio (min)</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorWaitTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="metric_date"
              tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              tick={{ fontSize: 12 }} 
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avg_wait_minutes" name="Espera (min)" stroke="#f97316" fillOpacity={1} fill="url(#colorWaitTime)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WaitTimeChart;