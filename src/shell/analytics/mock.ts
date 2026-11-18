import type { AnalyticsService, AnalyticsEvent } from './types';
import type { AnalyticsState } from './state';
import { isEnabled } from './state';

export class MockAnalyticsService implements AnalyticsService {
  public events: AnalyticsEvent[] = [];
  public state: AnalyticsState | null = null;
  public enabled: boolean = true;
  public flushed: boolean = false;

  public get captured(): AnalyticsEvent[] {
    return this.events;
  }

  public clear(): void {
    this.events = [];
    this.flushed = false;
  }

  public async start(state: AnalyticsState): Promise<void> {
    this.state = state;
    this.enabled = isEnabled(state);
  }

  public async capture(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }
    this.events.push(event);
  }

  public async setEnabled(on: boolean): Promise<void> {
    this.enabled = on;
    if (!on) {
      this.clear();
    }
  }

  public async flush(): Promise<void> {
    this.flushed = true;
  }
}
