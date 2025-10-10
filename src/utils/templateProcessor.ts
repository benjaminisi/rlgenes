import DOMPurify from 'dompurify';
import type { GeneticData, AlleleData, SNPResult, Zygosity, SectionSummary } from '../types';

/**
 * Extracts all RS IDs from template content
 */
export function extractRSIds(content: string): string[] {
  const rsIdPattern = /\bRS\d+\b/gi;
  const matches = content.match(rsIdPattern);

  if (!matches) return [];

  // Remove duplicates and convert to uppercase
  return [...new Set(matches.map(id => id.toUpperCase()))];
}

/**
 * Determines zygosity based on alleles and allele reference data
 */
export function determineZygosity(
  allele1: string,
  allele2: string,
  rsId: string,
  alleleReference: AlleleData[]
): Zygosity {
  // Check if data is missing
  if (allele1 === '-' || allele2 === '-' || !allele1 || !allele2) {
    return 'Data Missing';
  }

  // Find reference data for this RS ID
  const reference = alleleReference.find(ref => ref["RS ID"].toUpperCase() === rsId.toUpperCase());

  // Check if wild type (neither allele matches the effect allele)
  if (reference) {
    const effectAllele = reference["Effect Allele"].toUpperCase();
    // Wild type: neither allele is the effect allele
    if (allele1 !== effectAllele && allele2 !== effectAllele) {
      return 'Wild';
    }
  }

  // Determine homo/heterozygous based on alleles
  if (allele1 === allele2) {
    return 'Homozygous';
  } else {
    return 'Heterozygous';
  }
}

/**
 * Gets SNP results for all RS IDs in template
 */
export function getSNPResults(
  rsIds: string[],
  geneticData: GeneticData,
  alleleReference: AlleleData[]
): Map<string, SNPResult> {
  const results = new Map<string, SNPResult>();

  for (const rsId of rsIds) {
    const data = geneticData[rsId.toUpperCase()];

    if (!data) {
      results.set(rsId.toUpperCase(), {
        rsId,
        zygosity: 'Data Missing',
        alleles: '--'
      });
      continue;
    }

    const zygosity = determineZygosity(
      data.allele1,
      data.allele2,
      rsId,
      alleleReference
    );

    results.set(rsId.toUpperCase(), {
      rsId,
      zygosity,
      alleles: `${data.allele1}${data.allele2}`
    });
  }

  return results;
}

/**
 * Transforms template content by replacing RS IDs with formatted results
 */
export function transformTemplate(
  htmlContent: string,
  snpResults: Map<string, SNPResult>
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Helper function to create section ID from section name
  const getSectionId = (sectionName: string) => {
    return 'section-' + sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  // Add IDs to all h3 section headings for linking
  const headings = doc.querySelectorAll('h3');
  headings.forEach(heading => {
    const sectionName = heading.textContent?.trim() || '';
    if (sectionName && !sectionName.toLowerCase().includes('intro')) {
      heading.setAttribute('id', getSectionId(sectionName));
    }
  });

  // Process all text nodes to replace RS IDs
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const nodesToReplace: Array<{ node: Node; newHTML: string }> = [];

  let currentNode = walker.nextNode();
  while (currentNode) {
    const text = currentNode.textContent || '';
    const rsIdPattern = /\b(RS\d+)\b/gi;

    if (rsIdPattern.test(text)) {
      const newHTML = text.replace(rsIdPattern, (match) => {
        const rsId = match.toUpperCase();
        const result = snpResults.get(rsId);

        if (!result) {
          return `<span style="color: grey;">${match} [Data Missing]</span>`;
        }

        const { zygosity } = result;
        let color = 'black';
        let displayText = zygosity;

        if (zygosity === 'Homozygous') {
          color = 'red';
        } else if (zygosity === 'Wild') {
          displayText = 'Wild';
        } else if (zygosity === 'Data Missing') {
          color = 'grey';
        }

        return `${match} <span style="color: ${color}; font-weight: ${zygosity === 'Homozygous' ? 'bold' : 'normal'};">[${displayText}]</span>`;
      });

      nodesToReplace.push({ node: currentNode, newHTML });
    }

    currentNode = walker.nextNode();
  }

  // Apply replacements
  for (const { node, newHTML } of nodesToReplace) {
    const span = doc.createElement('span');
    span.innerHTML = newHTML;
    node.parentNode?.replaceChild(span, node);
  }

  // Filter out SNP subsections where all RS IDs are Data Missing or Wild (always filtered)
  const listItems = doc.querySelectorAll('li.c1.li-bullet-0, li[class*="li-bullet"]');
  listItems.forEach(li => {
    const text = li.textContent || '';
    const rsIds = extractRSIds(text);

    if (rsIds.length > 0) {
      // Check if all RS IDs are either Data Missing or Wild
      const allNonVariant = rsIds.every(rsId => {
        const result = snpResults.get(rsId.toUpperCase());
        return result?.zygosity === 'Wild' || result?.zygosity === 'Data Missing';
      });

      // Remove the subsection if all are non-variant
      if (allNonVariant) {
        (li as HTMLElement).style.display = 'none';
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * Calculates section summaries from the template
 */
export function calculateSectionSummaries(
  htmlContent: string,
  snpResults: Map<string, SNPResult>
): SectionSummary[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const summaries: SectionSummary[] = [];

  // Find all section headings (h3 elements)
  const headings = doc.querySelectorAll('h3');

  headings.forEach(heading => {
    const sectionName = heading.textContent?.trim() || 'Unknown Section';

    // Skip "Intro" sections
    if (sectionName.toLowerCase().includes('intro')) {
      return;
    }

    // Find content until next h3 or end
    const sectionContent: string[] = [];
    let currentElement = heading.nextElementSibling;

    while (currentElement && currentElement.tagName !== 'H3') {
      sectionContent.push(currentElement.textContent || '');
      currentElement = currentElement.nextElementSibling;
    }

    const fullText = sectionContent.join(' ');
    const rsIds = extractRSIds(fullText);

    if (rsIds.length === 0) {
      return; // Skip sections with no RS IDs
    }

    // Count zygosity types
    let heterozygousCount = 0;
    let homozygousCount = 0;
    let wildCount = 0;
    let missingCount = 0;

    rsIds.forEach(rsId => {
      const result = snpResults.get(rsId.toUpperCase());
      if (result) {
        switch (result.zygosity) {
          case 'Heterozygous':
            heterozygousCount++;
            break;
          case 'Homozygous':
            homozygousCount++;
            break;
          case 'Wild':
            wildCount++;
            break;
          case 'Data Missing':
            missingCount++;
            break;
        }
      }
    });

    const totalCount = rsIds.length;

    summaries.push({
      sectionName,
      heterozygousCount,
      homozygousCount,
      wildCount,
      missingCount,
      totalCount,
      heterozygousPercent: (heterozygousCount / totalCount) * 100,
      homozygousPercent: (homozygousCount / totalCount) * 100,
      wildPercent: (wildCount / totalCount) * 100,
      missingPercent: (missingCount / totalCount) * 100
    });
  });

  return summaries;
}

/**
 * Inserts summary statistics into the template after "Summary Placeholder" or "Summary Block"
 */
export function insertSummaries(
  htmlContent: string,
  summaries: SectionSummary[]
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  summaries.forEach(summary => {
    // Find the corresponding section
    const headings = doc.querySelectorAll('h3');

    for (const heading of Array.from(headings)) {
      const headingText = heading.textContent?.trim() || '';

      if (headingText === summary.sectionName) {
        // Find "Summary Placeholder" or "Summary Block" in this section
        let currentElement = heading.nextElementSibling;

        while (currentElement && currentElement.tagName !== 'H3') {
          const text = currentElement.textContent || '';

          if (text.includes('Summary Placeholder') || text.includes('Summary Block')) {
            // Create summary HTML
            const summaryHTML = `
              <div style="background-color: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h4 style="margin-top: 0;">Summary for ${summary.sectionName}</h4>
                <p><strong>Total SNPs analyzed:</strong> ${summary.totalCount}</p>
                <ul style="list-style: none; padding-left: 0;">
                  <li><span style="color: black;">Heterozygous: ${summary.heterozygousCount} (${summary.heterozygousPercent.toFixed(1)}%)</span></li>
                  <li><span style="color: red; font-weight: bold;">Homozygous: ${summary.homozygousCount} (${summary.homozygousPercent.toFixed(1)}%)</span></li>
                  <li><span style="color: green;">Wild Type: ${summary.wildCount} (${summary.wildPercent.toFixed(1)}%)</span></li>
                  ${summary.missingCount > 0 ? `<li><span style="color: grey;">Data Missing: ${summary.missingCount} (${summary.missingPercent.toFixed(1)}%)</span></li>` : ''}
                </ul>
              </div>
            `;

            const summaryDiv = doc.createElement('div');
            summaryDiv.innerHTML = summaryHTML;

            currentElement.parentNode?.insertBefore(summaryDiv, currentElement.nextSibling);
            break;
          }

          currentElement = currentElement.nextElementSibling;
        }

        break;
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * Sanitizes HTML content
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'u', 'a', 'b', 'i'],
    ALLOWED_ATTR: ['style', 'class', 'id', 'href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}
