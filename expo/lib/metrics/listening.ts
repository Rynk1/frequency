export const MIN_LISTENING_SECONDS = 5 * 60;

/**
 * A listening session is five minutes or more, or a session that reached the
 * end of its timer. Previews never count.
 */
export function isListeningSession(seconds: number, endedByTimer: boolean): boolean {
  return endedByTimer || seconds >= MIN_LISTENING_SECONDS;
}
