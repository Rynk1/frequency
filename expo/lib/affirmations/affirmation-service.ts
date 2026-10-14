import { Affirmation, AffirmationCategory, AffirmationFilterQuery } from '../../types/affirmation';
import { LAUNCH_AFFIRMATIONS } from '../../seed/affirmations';

export class AffirmationService {
  private static catalog: Affirmation[] = LAUNCH_AFFIRMATIONS;

  /**
   * Sets or updates the in-memory affirmation catalog (e.g., from Firestore sync).
   */
  public static setCatalog(catalog: Affirmation[]): void {
    if (Array.isArray(catalog) && catalog.length > 0) {
      this.catalog = catalog;
    }
  }

  /**
   * Returns the complete current catalog of affirmations.
   */
  public static getCatalog(): Affirmation[] {
    return this.catalog;
  }

  /**
   * Deterministic filter service prioritizing:
   * 1. Published state
   * 2. Intention Category match
   * 3. Session Context match (if provided)
   * 4. Language match (default 'en')
   * 5. Frequency compatibility (soft ranking boost, does NOT exclude valid intention affirmations if frequency metadata is missing)
   */
  public static getEligibleAffirmations(query: AffirmationFilterQuery): Affirmation[] {
    const {
      intentionCategory,
      frequencyId,
      sessionContext,
      language = 'en',
      tone,
      status = 'published',
    } = query;

    // Step 1: Base state & language filtering
    let candidates = this.catalog.filter(
      (item) => item.status === status && item.language.toLowerCase() === language.toLowerCase()
    );

    // Step 2: Strict Intention Filter
    if (intentionCategory) {
      const normalizedIntention = String(intentionCategory).toLowerCase();
      candidates = candidates.filter(
        (item) =>
          item.category.toLowerCase() === normalizedIntention ||
          item.intentTags.some((tag) => tag.toLowerCase() === normalizedIntention)
      );
    }

    // Step 3: Tone Filter (if strictly requested)
    if (tone) {
      const toneMatch = candidates.filter((item) => item.tone === tone);
      if (toneMatch.length > 0) {
        candidates = toneMatch;
      }
    }

    // Step 4: Session Context Filter (soft filter: preferred if available, but preserves candidates)
    if (sessionContext) {
      const normalizedContext = sessionContext.toLowerCase();
      const contextMatches = candidates.filter((item) =>
        item.sessionContexts.some((ctx) => ctx.toLowerCase() === normalizedContext)
      );
      if (contextMatches.length > 0) {
        candidates = contextMatches;
      }
    }

    // Step 5: Frequency Compatibility Ranking (boost matching frequency, but preserve intention candidates)
    if (frequencyId) {
      const freqNorm = frequencyId.toLowerCase();
      candidates.sort((a, b) => {
        const aMatch = a.compatibleFrequencyIds?.some((f) => f.toLowerCase() === freqNorm) ? 1 : 0;
        const bMatch = b.compatibleFrequencyIds?.some((f) => f.toLowerCase() === freqNorm) ? 1 : 0;
        if (bMatch !== aMatch) {
          return bMatch - aMatch; // Frequency matched items first
        }
        return (a.displayOrder || 99) - (b.displayOrder || 99);
      });
    } else {
      candidates.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
    }

    return candidates;
  }

  /**
   * Returns a deterministic default affirmation for a given query (e.g. first eligible item),
   * ensuring stable, predictable playback across re-renders or pause/resume events.
   */
  public static getDefaultAffirmation(query: AffirmationFilterQuery): Affirmation | null {
    const eligible = this.getEligibleAffirmations(query);
    return eligible.length > 0 ? eligible[0] : null;
  }

  /**
   * Deterministically returns the next affirmation in sequence for manual skip or auto-rotation.
   */
  public static getNextAffirmation(
    currentId: string | null,
    query: AffirmationFilterQuery
  ): Affirmation | null {
    const eligible = this.getEligibleAffirmations(query);
    if (eligible.length === 0) return null;
    if (!currentId) return eligible[0];

    const currentIndex = eligible.findIndex((item) => item.id === currentId);
    if (currentIndex === -1 || currentIndex === eligible.length - 1) {
      return eligible[0]; // Loop back to start
    }
    return eligible[currentIndex + 1];
  }
}
