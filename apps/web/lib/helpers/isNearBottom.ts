export function isNearBottom(container: HTMLDivElement) {
  const threshold = 100;

  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <
    threshold
  );
}
