/** Number of entries to go back when a private route is already in this session's stack. */
export function distanceToPreviousPath(
  previousPaths: readonly string[],
  destination: string,
): number {
  const index = previousPaths.lastIndexOf(destination);
  return index === -1 ? 0 : previousPaths.length - index;
}
