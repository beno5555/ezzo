// The largest number a badge writes out; anything larger shows as "99+".
const largestShownCount = 99;

type CountBadgeOptions = {
  // The count is a lower bound: a full page was read, and more may wait beyond it.
  mayBeMore?: boolean;
};

// The text of the count badge beside a navigation link: null (no badge) while the count is unknown or
// zero, the number up to 99, and "99+" above that or when the count may be larger than it says.
export function countBadgeText(
  count: number | null,
  { mayBeMore = false }: CountBadgeOptions = {},
): string | null {
  let text: string | null = null;

  const hasCount = count !== null && count > 0;
  if (hasCount) {
    const isOverLargest = mayBeMore || count > largestShownCount;
    text = isOverLargest ? `${largestShownCount}+` : `${count}`;
  }

  return text;
}
