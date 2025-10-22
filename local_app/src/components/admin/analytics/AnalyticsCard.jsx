import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';

const AnalyticsCard = ({ title, value, icon: Icon, loading }) => {
  return (
    <Card className="shadow-lg border-slate-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-3xl font-bold text-slate-800">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;