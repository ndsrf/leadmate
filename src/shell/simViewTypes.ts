export interface SimViewProps {
  /** Called with every message the simulation bundle posts to the shell. */
  onMessage: (message: unknown) => void;
  onLoadError?: () => void;
}

export interface SimViewHandle {
  /** Sends a message into the simulation bundle. */
  post: (message: unknown) => void;
}
