/**
 * Counts major sections (h3 headings) in an HTML template
 */
export function countMajorSections(htmlContent: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Count all h3 elements (major sections)
  const headings = doc.querySelectorAll('h3');
  let count = 0;

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() || '';
    // Skip intro sections
    if (!text.toLowerCase().includes('intro')) {
      count++;
    }
  });

  return count;
}

/**
 * Counts SNP subsections in an HTML template
 *
 * SNP subsections are defined as:
 * - Start after a heading containing "SNPs:"
 * - Each subsection begins with a bullet point (li element)
 * - Subsections end when another bullet starts or a "Summary" heading is encountered
 */
export function countSNPSubsections(htmlContent: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  let count = 0;

  // Simply count all li elements that contain RS IDs
  const listItems = doc.querySelectorAll('li');

  listItems.forEach((li) => {
    const text = li.textContent || '';
    // Check if this list item contains at least one RS ID
    const rsIdPattern = /\bRS\d+\b/gi;
    if (rsIdPattern.test(text)) {
      count++;
    }
  });

  return count;
}
