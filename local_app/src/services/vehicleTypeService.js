import { supabase } from '@/lib/supabaseClient';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';
    import { toast } from '@/components/ui/use-toast';

    export const getVehicleTypes = async () => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('vehicle_types')
          .select('*')
          .order('capacity', { ascending: true });
        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation);
    };

    export const getVehicleTypeById = async (id) => {
        const operation = async () => {
            if (!id) {
                console.warn(`getVehicleTypeById_warning: ID de vehículo nulo o indefinido. Usando fallback.`);
            }

            if (id) {
                const { data, error } = await supabase
                    .from('vehicle_types')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) {
                    console.error("Error cargando vehicle_type:", error.message);
                    if (NetworkErrorHandler.isNetworkError(error)) {
                        toast({
                            title: "Error de Conexión",
                            description: "No se pudo conectar con Supabase. Reintentando...",
                            variant: "destructive",
                        });
                    }
                    throw error;
                }

                if (data) {
                    return data;
                }
                
                console.warn(`No se encontró vehicle_type con ID: ${id}. Usando fallback.`);
            }

            const { data: list, error: listError } = await supabase
                .from('vehicle_types')
                .select('*')
                .eq('is_active', true)
                .order('name');
            
            if (listError || !list || list.length === 0) {
                console.error("No se pudo obtener la lista de vehículos de fallback.");
                return null;
            }

            const fallback = list.find(v => v.name === 'Auto') || list.find(v => v.name === 'Moto') || list[0];
            console.warn(`Usando fallback por defecto: ${fallback?.name}`);
            return fallback;
        };
        return NetworkErrorHandler.retryOperation(operation);
    };

    export const createVehicleType = async (vehicleTypeData) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('vehicle_types')
          .insert([vehicleTypeData])
          .select()
          .single();
        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation);
    };

    export const updateVehicleType = async (id, updates) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('vehicle_types')
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();
          
        if (error) {
            console.error("Error actualizando vehicle_type:", error.message);
            if (NetworkErrorHandler.isNetworkError(error)) {
                toast({
                    title: "Error de Conexión",
                    description: "No se pudo conectar con Supabase. Reintentando...",
                    variant: "destructive",
                });
            }
            throw error;
        }
        if (!data) {
            console.warn("No se encontró vehicle_type con ID para actualizar:", id);
        }
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation);
    };

    export const deleteVehicleType = async (id) => {
      const operation = async () => {
        const { data: tariff, error: tariffError } = await supabase.from('tariffs').delete().eq('vehicle_type_id', id);
        if(tariffError && tariffError.code !== 'PGRST116') { 
            throw new Error(`No se pudo eliminar la tarifa asociada: ${tariffError.message}`);
        }
        
        const { error } = await supabase
          .from('vehicle_types')
          .delete()
          .eq('id', id);
        if (error) throw new Error(`No se pudo eliminar el tipo de vehículo: ${error.message}`);
      };
      return NetworkErrorHandler.retryOperation(operation);
    };

    export const getActiveVehicleTypes = async () => {
        const operation = async () => {
          const { data, error } = await supabase
            .from('vehicle_types')
            .select(`
              *,
              tariffs (
                ride_type,
                base_fare,
                price_per_km,
                price_per_minute
              )
            `)
            .eq('is_active', true)
            .order('capacity', { ascending: true });
            
          if (error) {
            if (NetworkErrorHandler.isNetworkError(error)) {
                toast({
                    title: "Error de Conexión",
                    description: "No se pudo conectar con Supabase. Reintentando...",
                    variant: "destructive",
                });
            }
            throw error;
          }
          
          return data.map(vt => {
              const tariffNow = vt.tariffs?.find(t => t.ride_type === 'now') || {};
              const fallbackTariff = {
                base_fare: vt.base_fare,
                price_per_km: vt.price_per_km,
                price_per_minute: vt.price_per_minute
              };
              
              const { tariffs, ...rest } = vt;
              return { ...rest, ...fallbackTariff, ...tariffNow };
          });
        };
        return NetworkErrorHandler.retryOperation(operation);
      };