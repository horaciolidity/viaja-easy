import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Users } from 'lucide-react';

const NewUsersChart = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="shadow-lg h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Nuevos Pasajeros (Mensual)</CardTitle>
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
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Nuevos Pasajeros (Mensual)</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="signup_month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="new_passenger_count" name="Nuevos Pasajeros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default NewUsersChart;