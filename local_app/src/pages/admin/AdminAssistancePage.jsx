import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getAllAssistanceThreads, updateThreadAdminReadStatus } from '@/services/assistanceService';
import { Clock } from 'lucide-react';
import AssistanceSidebar from '@/components/admin/assistance/AssistanceSidebar';
import AssistanceList from '@/components/admin/assistance/AssistanceList';
import AssistanceChat from '@/components/admin/assistance/AssistanceChat';

const AdminAssistancePage = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', role: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchThreads = useCallback(async () => {
    try {
      const data = await getAllAssistanceThreads();
      setThreads(data);
    } catch (err) {
      setError('No se pudieron cargar los mensajes de asistencia.');
      toast({ title: 'Error', description: 'No se pudieron cargar los mensajes de asistencia.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchThreads();

    const threadsChannel = supabase
      .channel('public:assistance_threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_threads' },
        (payload) => {
          fetchThreads();
          if (selectedThread && payload.eventType === 'UPDATE' && payload.new.id === selectedThread.id) {
            setSelectedThread(prev => ({...prev, ...payload.new}));
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(threadsChannel);
    }
  }, [fetchThreads, selectedThread]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredThreads = useMemo(() => {
    return threads
      .filter(thread => {
        if (filters.status !== 'all' && thread.status !== filters.status) return false;
        if (filters.role !== 'all' && thread.role !== filters.role) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const profile = thread.created_by;
          return (
            profile?.full_name?.toLowerCase().includes(term) ||
            profile?.email?.toLowerCase().includes(term) ||
            profile?.phone?.includes(term)
          );
        }
        return true;
      });
  }, [threads, filters, searchTerm]);

  const handleSelectThread = async (thread) => {
    setSelectedThread(thread);
    if (thread.admin_has_unread) {
      const { error } = await updateThreadAdminReadStatus(thread.id, false);
      if (error) {
        toast({ title: 'Error', description: 'No se pudo marcar el mensaje como leído.', variant: 'destructive' });
      } else {
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, admin_has_unread: false } : t));
      }
    }
  };
  
  const handleThreadUpdate = (updatedThread) => {
    setSelectedThread(updatedThread);
    setThreads(prev => prev.map(t => t.id === updatedThread.id ? updatedThread : t));
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Clock className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="h-full flex bg-slate-100 rounded-lg overflow-hidden shadow-lg">
      <div className={`w-full md:w-2/5 lg:w-1/3 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
        <AssistanceSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <AssistanceList
          threads={filteredThreads}
          selectedThread={selectedThread}
          onSelectThread={handleSelectThread}
        />
      </div>
      <div className={`w-full md:w-3/5 lg:w-2/3 flex flex-col transition-all duration-300 bg-slate-50 ${selectedThread ? 'flex' : 'hidden md:flex'}`}>
        <AssistanceChat
          thread={selectedThread}
          onBack={() => setSelectedThread(null)}
          onThreadUpdate={handleThreadUpdate}
        />
      </div>
    </div>
  );
};

export default AdminAssistancePage;