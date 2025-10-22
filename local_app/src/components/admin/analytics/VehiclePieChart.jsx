import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Car, Bike } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-sm">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const VehiclePieChart = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="shadow-lg h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center"><Car className="mr-2 h-5 w-5" /> Distribución de Vehículos</CardTitle>
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
        <CardTitle className="flex items-center"><Car className="mr-2 h-5 w-5" /> Distribución de Vehículos</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={110}
              fill="#8884d8"
              dataKey="ride_count"
              nameKey="vehicle_name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} viajes`, name]}
               contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend iconType="circle" wrapperStyle={{fontSize: "14px"}} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VehiclePieChart;