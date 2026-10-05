// Invite tokens are base64url (A-Z a-z 0-9 _ -), so that is the only shape we allow.
// This rules out absolute URLs, //host, backslashes, encoded tricks and other paths.
const INVITE_PATH = /^\/invite\/[A-Za-z0-9_-]{1,128}$/;

/** Returns `next` only if it is a same-site invite path, otherwise null. */
export function getSafeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  return INVITE_PATH.test(next) ? next : null;
}