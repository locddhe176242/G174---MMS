import { useState, useEffect } from 'react';
import { getUserPermissions } from '../api/userPermissionService';
import useAuthStore from '../store/authStore';
import { jwtDecode } from 'jwt-decode';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const decoded = jwtDecode(token);
        const userId = decoded.userId || decoded.id || decoded.sub;

        if (!userId) {
          throw new Error('User ID not found in token');
        }

        const data = await getUserPermissions(userId);
        setPermissions(data);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [token]);

  const hasPermission = (permissionKey) => {
    if (!permissionKey) return false;
    
    return permissions.some(
      (perm) => perm.permissionKey === permissionKey && perm.status === 'active'
    );
  };

  const hasAnyPermission = (permissionKeys) => {
    if (!permissionKeys || permissionKeys.length === 0) return false;
    
    return permissionKeys.some((key) => hasPermission(key));
  };

  const hasAllPermissions = (permissionKeys) => {
    if (!permissionKeys || permissionKeys.length === 0) return false;
    
    return permissionKeys.every((key) => hasPermission(key));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default usePermissions;

