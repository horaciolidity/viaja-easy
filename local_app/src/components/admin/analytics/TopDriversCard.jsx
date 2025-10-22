import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Crown, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TopDriversCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="shadow-lg h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5" /> Top Conductores del Mes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Top 5 Conductores del Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {data && data.map((driver, index) => (
            <li key={driver.driver_id} className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${driver.full_name}`} />
                <AvatarFallback>{driver.full_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{driver.full_name}</p>
                <p className="text-xs text-slate-500">{driver.ride_count} viajes completados</p>
              </div>
              {index === 0 && <Crown className="h-5 w-5 text-yellow-400" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TopDriversCard;