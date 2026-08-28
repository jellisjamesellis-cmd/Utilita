/** Placeholder avatar from display name (no API key required) */
export function avatarUrl(displayName: string): string {
  const name = encodeURIComponent(displayName.trim() || "Pro");
  return `https://ui-avatars.com/api/?name=${name}&background=111111&color=ffffff&size=128&bold=true`;
}
