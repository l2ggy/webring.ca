/**
 * Detect whether an HTML page contains a valid webring widget.
 *
 * Requires all of:
 * 1. A marker: `data-webring="ca"` attribute or `webring.ca/embed.js` script
 * 2. A prev link: `href` pointing to `webring.ca/prev/`
 * 3. A next link: `href` pointing to `webring.ca/next/`
 *
 * HTML comments are stripped before detection so hidden markers don't pass.
 *
 * Known limitation: the prev/next links are not checked against a specific
 * member slug. A site could embed another member's widget HTML and pass.
 * In practice, using the embed script generates correct links automatically.
 */
export function detectWidget(html: string): boolean {
  const stripped = html.toLowerCase().replace(/<!--[\s\S]*?-->/g, '')
  const hasMarker = stripped.includes('data-webring="ca"') || stripped.includes('webring.ca/embed.js')
  const hasPrev = /href=["'][^"']*webring\.ca\/prev\//.test(stripped)
  const hasNext = /href=["'][^"']*webring\.ca\/next\//.test(stripped)
  return hasMarker && hasPrev && hasNext
}
