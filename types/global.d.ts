declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: { status?: string | null }) => void;
  }
}

export {};