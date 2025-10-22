import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export function useUserDocuments(filter = { status: 'pending', userType: 'all' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      let query;
      
      if (filter.userType === 'driver') {
        query = supabase.from('v_driver_documents_rows').select('*, user_type: \'driver\', doc_id: id');
        if (filter.status && filter.status !== 'all') {
          query = query.eq('status', filter.status);
        }
      } else if (filter.userType === 'passenger') {
        query = supabase.from('v_passenger_documents_rows').select('*, user_type: \'passenger\', doc_id: id');
        if (filter.status && filter.status !== 'all') {
          query = query.eq('status', filter.status);
        }
      } else {
        const rpcParams = {};
        if (filter.status && filter.status !== 'all') {
          rpcParams.p_status = filter.status;
        }
        query = supabase.rpc('get_all_user_documents', rpcParams);
      }
      
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setRows(data ?? []);
    } catch (error) {
      toast({
        title: "Error al cargar documentos",
        description: error.message,
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.userType]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, refetch };
}