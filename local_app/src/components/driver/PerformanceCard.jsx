import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Star, ShieldCheck, Award, ShieldX } from 'lucide-react';

const getLevelStyles = (level) => {
  switch (level) {
    case 'Platino':
      return {
        badge: 'bg-slate-200 text-slate-800 border-slate-400',
        icon: <Award className="w-5 h-5 text-slate-600" />,
        gradient: 'from-slate-500 to-slate-700',
        textColor: 'text-slate-100',
      };
    case 'Oro':
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <Star className="w-5 h-5 text-amber-500" />,
        gradient: 'from-amber-400 to-amber-600',
        textColor: 'text-white',
      };
    case 'Plata':
      return {
        badge: 'bg-gray-200 text-gray-800 border-gray-400',
        icon: <ShieldCheck className="w-5 h-5 text-gray-500" />,
        gradient: 'from-gray-400 to-gray-600',
        textColor: 'text-white',
      };
    case 'Bronce':
    default:
      return {
        badge: 'bg-orange-200 text-orange-900 border-orange-400',
        icon: <ShieldX className="w-5 h-5 text-orange-600" />,
        gradient: 'from-orange-400 to-orange-600',
        textColor: 'text-white',
      };
  }
};

const PerformanceCard = ({ stats }) => {
  const level = stats?.level || 'Bronce';
  const { badge, icon, gradient, textColor } = getLevelStyles(level);
  const cancellationRate = stats?.cancellation_rate ?? 0;
  const acceptanceRate = stats?.acceptance_rate ?? 0;

  const getProgressBarWidth = (rate) => `${Math.min(100, Math.max(0, rate))}%`;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-bold text-slate-700">Tu Nivel</CardTitle>
          <Badge variant="outline" className={`text-sm font-bold px-3 py-1 ${badge}`}>
            <span className="mr-2">{React.cloneElement(icon, { className: 'w-4 h-4' })}</span>
            {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-slate-500">Tasa de Aceptación</p>
            <p className="text-sm font-bold text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> {acceptanceRate.toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: getProgressBarWidth(acceptanceRate) }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-slate-500">Tasa de Cancelación</p>
            <p className={`text-sm font-bold flex items-center ${cancellationRate > 10 ? 'text-red-600' : 'text-slate-600'}`}>
              {cancellationRate > 10 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
              {cancellationRate.toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className={`${cancellationRate > 10 ? 'bg-red-500' : 'bg-slate-400'} h-2 rounded-full`} style={{ width: getProgressBarWidth(cancellationRate) }}></div>
          </div>
        </div>
        <p className="text-xs text-center text-slate-400 pt-2">Estadísticas de los últimos 30 días.</p>
      </CardContent>
    </Card>
  );
};

export default PerformanceCard;