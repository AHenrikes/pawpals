export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} month ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}
