import type { BuiltEvent } from './contract';
import type { AnalyticsState } from './state';

export interface AnalyticsEvent extends BuiltEvent {
  timestamp?: number | Date;
}

export interface AnalyticsService {
  start(state: AnalyticsState): Promise<void> | void;
  capture(event: AnalyticsEvent): Promise<void> | void;
  setEnabled(on: boolean): Promise<void> | void;
  flush(): Promise<void> | void;
  /** Sets super properties sent with every later event, including the SDK's own tap events. */
  register(properties: Record<string, string | number | boolean>): Promise<void> | void;
}
