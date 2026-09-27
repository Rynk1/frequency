export type AdminRole =
  | 'super_admin'
  | 'support_admin'
  | 'finance_admin'
  | 'content_admin'
  | 'analytics_admin'
  | 'operations_admin'
  | 'admin'
  | 'user';

export type AdminPermission =
  | 'users.read'
  | 'users.write'
  | 'subscriptions.read'
  | 'subscriptions.reconcile'
  | 'payments.read'
  | 'payments.refund'
  | 'content.write'
  | 'analytics.read'
  | 'admins.manage';

export type AccountLifecycleState =
  | 'CREATED'
  | 'EMAIL_UNVERIFIED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DELETION_PENDING'
  | 'DELETED';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'users.read',
    'users.write',
    'subscriptions.read',
    'subscriptions.reconcile',
    'payments.read',
    'payments.refund',
    'content.write',
    'analytics.read',
    'admins.manage',
  ],
  admin: [
    'users.read',
    'users.write',
    'subscriptions.read',
    'subscriptions.reconcile',
    'payments.read',
    'payments.refund',
    'content.write',
    'analytics.read',
  ],
  support_admin: [
    'users.read',
    'subscriptions.read',
    'subscriptions.reconcile',
  ],
  finance_admin: [
    'subscriptions.read',
    'subscriptions.reconcile',
    'payments.read',
    'payments.refund',
  ],
  content_admin: [
    'content.write',
    'analytics.read',
  ],
  analytics_admin: [
    'analytics.read',
    'users.read',
  ],
  operations_admin: [
    'users.read',
    'subscriptions.read',
    'subscriptions.reconcile',
    'analytics.read',
  ],
  user: [],
};

export function hasPermission(role: string | null | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as AdminRole] || [];
  return permissions.includes(permission);
}
