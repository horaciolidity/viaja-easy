import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Users, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, iconColor }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </CardContent>
  </Card>
);

const LiveRidesStats = ({ ridesCount, driversCount, availableDriversCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard title="Viajes Activos" value={ridesCount} icon={Car} iconColor="text-blue-500" />
      <StatCard title="Conductores Activos" value={driversCount} icon={Users} iconColor="text-green-500" />
      <StatCard title="Disponibles" value={availableDriversCount} icon={CheckCircle} iconColor="text-purple-500" />
    </div>
  );
};

export default LiveRidesStats;