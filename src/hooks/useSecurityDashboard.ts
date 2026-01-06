import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuthAttemptLog {
  id: string;
  email: string;
  user_id: string | null;
  attempt_type: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  company_id: string | null;
  created_at: string;
}

export interface SecurityMetrics {
  totalAttempts24h: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  uniqueIPs: number;
  activeCompanies: number;
  activeAlerts: number;
  attemptsByHour: { hour: string; success: number; failed: number }[];
  topFailedIPs: { ip: string; count: number }[];
  attemptsByCompany: { company_id: string; company_name: string; count: number }[];
}

export function useSecurityDashboard() {
  return useQuery({
    queryKey: ['security-dashboard'],
    queryFn: async (): Promise<SecurityMetrics> => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Fetch auth attempts from last 24 hours
      const { data: attempts, error: attemptsError } = await supabase
        .from('auth_attempt_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });
      
      if (attemptsError) throw attemptsError;
      
      // Fetch active alerts count
      const { count: activeAlerts, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      
      if (alertsError) throw alertsError;
      
      const logs = attempts || [];
      
      // Calculate metrics
      const successfulAttempts = logs.filter(a => a.success).length;
      const failedAttempts = logs.filter(a => !a.success).length;
      const totalAttempts24h = logs.length;
      const successRate = totalAttempts24h > 0 
        ? Math.round((successfulAttempts / totalAttempts24h) * 100) 
        : 0;
      
      // Unique IPs
      const uniqueIPs = new Set(logs.map(a => a.ip_address).filter(Boolean)).size;
      
      // Active companies
      const activeCompanies = new Set(logs.map(a => a.company_id).filter(Boolean)).size;
      
      // Attempts by hour (last 24h)
      const hourlyData: Record<string, { success: number; failed: number }> = {};
      for (let i = 23; i >= 0; i--) {
        const hourDate = new Date(Date.now() - i * 60 * 60 * 1000);
        const hourKey = hourDate.toISOString().substring(0, 13);
        hourlyData[hourKey] = { success: 0, failed: 0 };
      }
      
      logs.forEach(attempt => {
        const hourKey = attempt.created_at.substring(0, 13);
        if (hourlyData[hourKey]) {
          if (attempt.success) {
            hourlyData[hourKey].success++;
          } else {
            hourlyData[hourKey].failed++;
          }
        }
      });
      
      const attemptsByHour = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: new Date(hour + ':00:00Z').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ...data
      }));
      
      // Top failed IPs
      const failedByIP: Record<string, number> = {};
      logs.filter(a => !a.success && a.ip_address).forEach(a => {
        failedByIP[a.ip_address!] = (failedByIP[a.ip_address!] || 0) + 1;
      });
      
      const topFailedIPs = Object.entries(failedByIP)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));
      
      // Attempts by company
      const byCompany: Record<string, number> = {};
      logs.forEach(a => {
        if (a.company_id) {
          byCompany[a.company_id] = (byCompany[a.company_id] || 0) + 1;
        }
      });
      
      const attemptsByCompany = Object.entries(byCompany)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([company_id, count]) => ({ 
          company_id, 
          company_name: company_id.substring(0, 8) + '...', 
          count 
        }));
      
      return {
        totalAttempts24h,
        successfulAttempts,
        failedAttempts,
        successRate,
        uniqueIPs,
        activeCompanies,
        activeAlerts: activeAlerts || 0,
        attemptsByHour,
        topFailedIPs,
        attemptsByCompany
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAuthAttemptLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  email?: string;
  ip?: string;
}) {
  return useQuery({
    queryKey: ['auth-attempt-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('auth_attempt_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      if (filters?.ip) {
        query = query.ilike('ip_address', `%${filters.ip}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AuthAttemptLog[];
    },
  });
}
