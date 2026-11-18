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
}
