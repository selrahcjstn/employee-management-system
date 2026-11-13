const ROLE_LABELS: Record<string, string> = { admin: 'Administrator' };

/** The role as a person reads it: "admin" -> "Administrator", anything else capitalised. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}
