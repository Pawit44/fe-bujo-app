'use client';

import {
  BookOpen,
  Briefcase,
  CalendarDays,
  CalendarRange,
  Compass,
  Dumbbell,
  Heart,
  Home,
  LayoutList,
  Lightbulb,
  MessageCircle,
  Music,
  Plane,
  Receipt,
  Rows3,
  Sprout,
  Star,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/** One icon per spread — shared by the sidebar nav and the Index page cards, so they always match. */
export const LOG_ICONS = {
  index: LayoutList,
  future: CalendarRange,
  monthly: CalendarDays,
  weekly: Rows3,
} satisfies Record<string, LucideIcon>;

/**
 * Collections used to store a raw emoji character as their `icon` value.
 * The picker now stores one of these ids instead — flat text, themeable,
 * consistent line-icon weight instead of mismatched emoji art.
 *
 * To add a collection icon: add an id + Lucide icon here. Old data keeps
 * rendering correctly because `resolveCollectionIcon` also maps the emoji
 * this app used to store, so nothing already saved ever breaks.
 */
export const COLLECTION_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: 'book', Icon: BookOpen },
  { id: 'idea', Icon: Lightbulb },
  { id: 'target', Icon: Target },
  { id: 'sprout', Icon: Sprout },
  { id: 'compass', Icon: Compass },
  { id: 'fitness', Icon: Dumbbell },
  { id: 'food', Icon: UtensilsCrossed },
  { id: 'travel', Icon: Plane },
  { id: 'music', Icon: Music },
  { id: 'receipt', Icon: Receipt },
  { id: 'chat', Icon: MessageCircle },
  { id: 'star', Icon: Star },
  { id: 'heart', Icon: Heart },
  { id: 'home', Icon: Home },
  { id: 'briefcase', Icon: Briefcase },
];

export const DEFAULT_COLLECTION_ICON = COLLECTION_ICONS[0].id;

/** Icon ids this app used to store before it switched away from emoji. */
const LEGACY_EMOJI: Record<string, string> = {
  '📕': 'book',
  '📚': 'book',
  '💡': 'idea',
  '🎯': 'target',
  '🌱': 'sprout',
  '🧭': 'compass',
  '🏃': 'fitness',
  '🍳': 'food',
  '✈️': 'travel',
  '🎧': 'music',
  '🧾': 'receipt',
  '💬': 'chat',
};

function findIcon(id: string): LucideIcon | undefined {
  return COLLECTION_ICONS.find((c) => c.id === id)?.Icon;
}

/**
 * Renders a collection's icon. Accepts either a current icon id (e.g. "book")
 * or a legacy emoji from data saved before the icon system existed; falls
 * back to the raw stored value so nothing ever renders blank.
 */
export function CollectionIcon({ icon, size = 17 }: { icon: string; size?: number }) {
  const Icon = findIcon(icon) ?? findIcon(LEGACY_EMOJI[icon] ?? '');
  if (Icon) return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
  return <span aria-hidden="true">{icon}</span>;
}
