export interface NavIntent {
  href: string;
  from: string;
}

let intent: NavIntent | null = null;
const listeners = new Set<() => void>();

export function setNavIntent(next: NavIntent) {
  intent = next;
  listeners.forEach((listener) => listener());
}

export function subscribeNavIntent(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNavIntent() {
  return intent;
}
