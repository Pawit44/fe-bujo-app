/** Palette tokens an entry's `color` field can hold. Empty string ("") is
 * the default/uncolored look and isn't in this list — it's just the absence
 * of a choice, styled the same as any other bullet. */
export const EVENT_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'gray',
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

export function isEventColor(value: string): value is EventColor {
  return (EVENT_COLORS as readonly string[]).includes(value);
}
