/**
 * A program is locked when the seed marks it premium and the listener has no
 * premium or trial entitlement. The flag lives on the program so a free
 * program can never be locked by category.
 */
export function isProgramLocked(programIsPremium: boolean | undefined, hasPremiumAccess: boolean): boolean {
  return Boolean(programIsPremium) && !hasPremiumAccess;
}
