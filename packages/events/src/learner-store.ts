import type { LearningDNAEvent } from '../../schemas/src/events.ts';

/**
 * Learner Privacy & Learning DNA Event Store
 * AGENTS.md Rule 12: Never retain learner data beyond configured retention settings.
 * Spec Section 15.2: Learners can view, export, and delete their learning data.
 */
export class LearnerEventStore {
  private events: Map<string, LearningDNAEvent[]> = new Map();

  recordEvent(event: LearningDNAEvent) {
    const list = this.events.get(event.user_id) || [];
    list.push(event);
    this.events.set(event.user_id, list);
  }

  getEvents(userId: string): LearningDNAEvent[] {
    return this.events.get(userId) || [];
  }

  exportData(userId: string): string {
    const userEvents = this.getEvents(userId);
    return JSON.stringify(
      {
        user_id: userId,
        exported_at: new Date().toISOString(),
        total_events: userEvents.length,
        events: userEvents,
      },
      null,
      2
    );
  }

  /**
   * Completely purges all stored events for the user.
   * Guarantees total deletion (AGENTS.md Rule 12).
   */
  deleteUserData(userId: string): boolean {
    return this.events.delete(userId);
  }

  clearAll(): void {
    this.events.clear();
  }
}
