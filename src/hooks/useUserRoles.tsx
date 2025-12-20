import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    
    // Fetch all user roles with profile info
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, assigned_at');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      setLoading(false);
      return;
    }

    // Fetch profiles for these users
    const userIds = rolesData?.map(r => r.user_id) || [];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Combine data
    const combinedUsers: UserWithRole[] = (rolesData || []).map(role => {
      const profile = profilesData?.find(p => p.id === role.user_id);
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
    setLoading(false);
  };

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
    loading,
    fetchAllUsers,
    assignRole,
    removeRole,
    revokeAccess,
    checkAdminStatus,
  };
}
