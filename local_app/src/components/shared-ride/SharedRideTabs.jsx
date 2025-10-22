import React from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Search, Route } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import FindRideView from '@/components/shared-ride/FindRideView';
    import MyRidesTab from '@/components/shared-ride/MyRidesTab';
    
    const SharedRideTabs = ({ profile }) => {
      const isDriver = profile?.user_type === 'driver';
      const defaultTab = isDriver ? 'my-rides' : 'find';
    
      return (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find"><Search className="w-4 h-4 mr-2"/>Buscar Viaje</TabsTrigger>
            {isDriver && <TabsTrigger value="my-rides"><Route className="w-4 h-4 mr-2"/>Ofrecer Viaje</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="find">
            <AnimatePresence mode="wait">
              <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FindRideView />
              </motion.div>
            </AnimatePresence>
          </TabsContent>
          
          {isDriver && (
            <TabsContent value="my-rides">
              <AnimatePresence mode="wait">
                <motion.div key="my-rides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MyRidesTab profile={profile} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          )}
        </Tabs>
      );
    };
    
    export default SharedRideTabs;