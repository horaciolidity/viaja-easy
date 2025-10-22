import React from 'react';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Loader2 } from 'lucide-react';
    import { motion } from 'framer-motion';

    const DriverStatCard = ({ icon: Icon, title, value, subtitle, color, isLoading }) => {
      return (
        <motion.div 
            className="h-full"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <Card className="shadow-lg h-full flex flex-col justify-between bg-white dark:bg-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
                    {Icon && <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
                            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      );
    };

    export default DriverStatCard;