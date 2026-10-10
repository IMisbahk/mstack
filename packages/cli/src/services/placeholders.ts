/** Count unresolved template markers in planning documents. */
export function countPlaceholders(content: string): number {
  let count = content.match(/YYYY-MM-DD|\{\{[^}\n]+\}\}/g)?.length ?? 0;
  for (const match of content.matchAll(/\[([^\]\n]{2,160})\]/g)) {
    const index = match.index ?? 0;
    const next = content[index + match[0].length];
    const previous = content[index - 1];
    if (next !== "(" && previous !== "!" && !/^[ xX]$/.test(match[1] ?? "")) count += 1;
  }
  return count;
}
