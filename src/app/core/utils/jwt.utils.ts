export type JwtPayload = Record<string, unknown>;

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    return JSON.parse(atob(paddedBase64)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const roleValue = payload['role'];
  if (typeof roleValue === 'string' && roleValue.trim()) {
    return roleValue;
  }

  const rolesValue = payload['roles'];
  if (Array.isArray(rolesValue) && rolesValue.length > 0 && typeof rolesValue[0] === 'string') {
    return rolesValue[0];
  }

  return null;
}
