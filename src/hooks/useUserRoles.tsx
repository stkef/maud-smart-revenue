import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'officer';
  assigned_at: string;
}

export function useUserRoles() {
  const { user, isAdmin, rolesLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    
    try {
      // Fetch all user roles with profile info in parallel
      const [rolesResult, profilesResult] = await Promise.all([
        supabase.from('user_roles').select('user_id, role, assigned_at'),
        supabase.from('profiles').select('id, email, full_name'),
      ]);

      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
        return;
      }

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
        return;
      }

      const rolesData = rolesResult.data || [];
      const profilesData = profilesResult.data || [];

      // Combine data
      const combinedUsers: UserWithRole[] = rolesData.map(role => {
        const profile = profilesData.find(p => p.id === role.user_id);
        return {
          user_id: role.user_id,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || 'Unknown',
          role: role.role as 'admin' | 'officer',
          assigned_at: role.assigned_at,
        };
      });

      // Group by user and take highest role
      const userMap = new Map<string, UserWithRole>();
      combinedUsers.forEach(u => {
        const existing = userMap.get(u.user_id);
        if (!existing || (u.role === 'admin' && existing.role !== 'admin')) {
          userMap.set(u.user_id, u);
        }
      });

      setUsers(Array.from(userMap.values()));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const assignRole = async (userId: string, role: 'admin' | 'officer') => {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        assigned_by: user?.id,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
    
    await fetchAllUsers();
  };

  const removeRole = async (userId: string, role: 'admin' | 'officer') => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) throw error;
    await fetchAllUsers();
  };

  const revokeAccess = async (userId: string) => {
    // Remove all roles for this user
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    await fetchAllUsers();
  };

  return {
    users,
    isAdmin,
    loading: loading || rolesLoading,
    fetchAllUsers,
    assignRole,
    removeRole,
    revokeAccess,
  };
}
