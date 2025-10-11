import React from 'react';
import PropTypes from 'prop-types';
import usePermissions from '../hooks/usePermissions';

const PermissionGuard = ({ 
  permission, 
  anyOf, 
  allOf, 
  children, 
  fallback = null,
  loading: customLoading = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading && customLoading) {
    return customLoading;
  }

  if (loading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  } else {
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
};

PermissionGuard.propTypes = {
  permission: PropTypes.string,
  anyOf: PropTypes.arrayOf(PropTypes.string),
  allOf: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  loading: PropTypes.node,
};

export default PermissionGuard;

