import { User } from '../types';

export type Role = 'DOCTOR' | 'NURSE' | 'STAFF' | 'ADMIN';

export type Permission = 
  | 'view_patients'
  | 'create_patients'
  | 'edit_patients'
  | 'delete_patients'
  | 'view_medical_records'
  | 'create_medical_records'
  | 'view_appointments'
  | 'create_appointments'
  | 'edit_appointments'
  | 'cancel_appointments'
  | 'view_invoices'
  | 'create_invoices'
  | 'edit_invoices'
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'view_lab_results'
  | 'create_lab_results'
  | 'view_presets'
  | 'create_presets'
  | 'view_tags'
  | 'create_tags'
  | 'view_custom_fields'
  | 'create_custom_fields'
  | 'view_note_templates'
  | 'create_note_templates'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_settings'
  | 'edit_settings';

const rolePermissions: Record<string, Permission[]> = {
  DOCTOR: [
    'view_patients', 'create_patients', 'edit_patients',
    'view_medical_records', 'create_medical_records',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets', 'create_presets',
    'view_tags', 'create_tags',
    'view_custom_fields', 'create_custom_fields',
    'view_note_templates', 'create_note_templates',
    'view_users', 'create_users', 'edit_users',
    'view_settings', 'edit_settings',
  ],
  NURSE: [
    'view_patients', 'create_patients', 'edit_patients',
    'view_medical_records', 'create_medical_records',
    'view_appointments', 'create_appointments',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets',
    'view_tags', 'create_tags',
    'view_custom_fields',
    'view_note_templates',
  ],
  STAFF: [
    'view_patients', 'create_patients',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks',
    'view_lab_results',
    'view_presets',
    'view_tags', 'create_tags',
    'view_custom_fields',
    'view_note_templates',
  ],
  ADMIN: [
    'view_patients', 'create_patients', 'edit_patients', 'delete_patients',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets', 'create_presets',
    'view_tags', 'create_tags',
    'view_custom_fields', 'create_custom_fields',
    'view_note_templates', 'create_note_templates',
    'view_users', 'create_users', 'edit_users', 'delete_users',
    'view_settings', 'edit_settings',
  ],
};

interface PermissionUser {
  role?: string;
}

export function hasPermission(user: PermissionUser | null, permission: Permission): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role || ''] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(user: PermissionUser | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some(p => hasPermission(user, p));
}

export function getPermissions(user: PermissionUser | null): Permission[] {
  if (!user) return [];
  return rolePermissions[user.role || ''] || [];
}

export function canAccessRoute(user: PermissionUser | null, path: string): boolean {
  if (!user) return false;
  
  const routePermissions: Record<string, Permission[]> = {
    '/patients': ['view_patients'],
    '/patients/:id': ['view_patients'],
    '/appointments': ['view_appointments'],
    '/invoices': ['view_invoices'],
    '/lab-results': ['view_lab_results'],
    '/tasks': ['view_tasks'],
    '/presets': ['view_presets'],
    '/tags': ['view_tags'],
    '/custom-fields': ['view_custom_fields'],
    '/note-templates': ['view_note_templates'],
    '/users': ['view_users'],
    '/settings': ['view_settings'],
    '/email-settings': ['view_settings'],
  };

  const basePath = path.split('/').slice(0, 2).join('/');
  const permissions = routePermissions[basePath] || routePermissions[path];
  
  if (!permissions) return true;
  return permissions.some(p => hasPermission(user, p));
}
