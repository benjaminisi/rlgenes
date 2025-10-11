import DOMPurify from 'dompurify';
import type { GeneticData, AlleleData, SNPResult, Zygosity, SectionSummary } from '../types';

/**
 * Extracts the first header (h1, h2, etc.) from HTML content to use as the report title
 */
export function extractTemplateTitle(htmlContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Try to find the first heading (h1, h2, h3, h4, h5, h6)
  for (let i = 1; i <= 6; i++) {
    const heading = doc.querySelector(`h${i}`);
    if (heading && heading.textContent) {
      return heading.textContent.trim();
    }
  }

  return 'Genetic Report'; // Default fallback
}

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
 *
 * Definitions:
 * - Homozygous: Both alleles match the effect allele
 * - Heterozygous: Only one allele matches the effect allele
 * - Wild: Neither allele matches the effect allele
 * - Data Missing: One or both alleles are missing or invalid
 * - Reference Missing: No effect allele available to compare against
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

  // Normalize alleles to uppercase for comparison
  const normalizedAllele1 = allele1.toUpperCase();
  const normalizedAllele2 = allele2.toUpperCase();

  // Find reference data for this RS ID
  const reference = alleleReference.find(ref => ref.rsId.toUpperCase() === rsId.toUpperCase());

  // If we have a valid effect allele, use it to determine zygosity
  if (reference?.problemAllele && reference.problemAllele.trim() !== '') {
    const effectAllele = reference.problemAllele.toUpperCase();

    const allele1MatchesEffect = normalizedAllele1 === effectAllele;
    const allele2MatchesEffect = normalizedAllele2 === effectAllele;

    // Homozygous: Both alleles match the effect allele
    if (allele1MatchesEffect && allele2MatchesEffect) {
      return 'Homozygous';
    }
    // Heterozygous: Only one allele matches the effect allele
    else if (allele1MatchesEffect || allele2MatchesEffect) {
      return 'Heterozygous';
    }
    // Wild type: Neither allele matches the effect allele
    else {
      return 'Wild';
    }
  }

  // No valid effect allele - cannot determine Homozygous/Heterozygous/Wild
  // This happens when:
  // - Effect allele is empty string
  // - Effect allele is undefined
  // - RS ID is not in the reference at all
  return 'Reference Missing';
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

    // Find reference data for this RS ID
    const reference = alleleReference.find(ref => ref.rsId.toUpperCase() === rsId.toUpperCase());

    if (!data) {
      results.set(rsId.toUpperCase(), {
        rsId,
        zygosity: 'Data Missing',
        alleles: '--',
        effectAllele: reference?.problemAllele,
        gene: reference?.gene
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
      alleles: `${data.allele1}${data.allele2}`,
      effectAllele: reference?.problemAllele,
      gene: reference?.gene
    });
  }

  return results;
}

/**
 * Transforms template content by replacing RS IDs with formatted results
 * and populating metadata fields
 */
export function transformTemplate(
  htmlContent: string,
  snpResults: Map<string, SNPResult>,
  genomeFilename?: string,
  genomeDate?: string,
  grandSummaryHTML?: string,
  showDetailedAnnotations: boolean = false,
  showAllSubsections: boolean = false
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Populate metadata fields
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Find the first heading (title) and insert metadata after it
  let titleElement = null;
  for (let i = 1; i <= 6; i++) {
    titleElement = doc.querySelector(`h${i}`);
    if (titleElement) break;
  }

  // Create and insert metadata and grand summary after the title
  if (titleElement) {
    // Create metadata section
    const metadataDiv = doc.createElement('div');
    metadataDiv.style.cssText = 'background-color: #f0f4f8; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;';

    const metadataItems: string[] = [];

    if (genomeFilename) {
      metadataItems.push(`<p style="margin: 5px 0;"><strong>Genome File:</strong> ${genomeFilename}</p>`);
    }

    if (genomeDate) {
      metadataItems.push(`<p style="margin: 5px 0;"><strong>Genome Date:</strong> ${genomeDate}</p>`);
    }

    metadataItems.push(`<p style="margin: 5px 0;"><strong>Report Generated:</strong> ${reportDate}</p>`);

    metadataDiv.innerHTML = metadataItems.join('');

    // Insert metadata after the title element
    titleElement.parentNode?.insertBefore(metadataDiv, titleElement.nextSibling);
  }

  // Find and replace "TABLE of CONTENTS (autogenerated)" or insert before "Introduction"
  if (grandSummaryHTML) {
    const grandSummaryDiv = doc.createElement('div');
    grandSummaryDiv.id = 'grand-summary';
    grandSummaryDiv.innerHTML = grandSummaryHTML;

    // Look for "TABLE of CONTENTS" heading
    let tocElement = null;
    const allHeadings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    for (const heading of Array.from(allHeadings)) {
      const text = heading.textContent?.trim().toLowerCase() || '';
      if (text.includes('table of contents')) {
        tocElement = heading;
        break;
      }
    }

    if (tocElement) {
      // Replace the TOC heading with the Grand Summary
      tocElement.parentNode?.replaceChild(grandSummaryDiv, tocElement);
    } else {
      // Look for "Introduction" section
      let introElement = null;
      for (const heading of Array.from(allHeadings)) {
        const text = heading.textContent?.trim().toLowerCase() || '';
        if (text === 'introduction' || text.includes('intro')) {
          introElement = heading;
          break;
        }
      }

      if (introElement) {
        // Insert before Introduction
        introElement.parentNode?.insertBefore(grandSummaryDiv, introElement);
      } else {
        // Fallback: insert after metadata if no TOC or Introduction found
        if (titleElement) {
          const metadataDiv = titleElement.nextSibling;
          if (metadataDiv && metadataDiv.nextSibling) {
            titleElement.parentNode?.insertBefore(grandSummaryDiv, metadataDiv.nextSibling);
          } else if (metadataDiv) {
            metadataDiv.parentNode?.insertBefore(grandSummaryDiv, metadataDiv.nextSibling);
          }
        }
      }
    }
  }

  // Helper function to create section ID from section name
  const getSectionId = (sectionName: string) => {
    return 'section-' + sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  // Add IDs to all h3 section headings for linking and insert "Return to Grand Summary" buttons
  const headings = doc.querySelectorAll('h3');
  headings.forEach((heading, index) => {
    const sectionName = heading.textContent?.trim() || '';
    if (sectionName && !sectionName.toLowerCase().includes('intro')) {
      heading.setAttribute('id', getSectionId(sectionName));

      // Insert "Return to Grand Summary" button before each section (except the first)
      if (index > 0) {
        const returnButton = doc.createElement('div');
        returnButton.style.cssText = 'text-align: center; margin: 20px 0;';
        returnButton.innerHTML = '<a href="#grand-summary" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: 600;">↑ Return to Grand Summary</a>';
        heading.parentNode?.insertBefore(returnButton, heading);
      }
    }
  });

  // Process all text nodes to replace RS IDs with formatted results including icons
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

        const { zygosity, alleles, effectAllele, gene } = result;

        // Build detailed annotation string if enabled
        let detailedInfo = '';
        if (showDetailedAnnotations) {
          const parts: string[] = [];

          // For Homozygous, Heterozygous, and Wild: show alleles, effect allele, and gene
          if (zygosity === 'Homozygous' || zygosity === 'Heterozygous' || zygosity === 'Wild') {
            if (alleles) parts.push(`Alleles: ${alleles}`);
            if (effectAllele) parts.push(`Effect: ${effectAllele}`);
            if (gene) parts.push(`Gene: ${gene}`);
          }
          // For Reference Missing: show genome alleles (but no effect allele since it's missing)
          else if (zygosity === 'Reference Missing') {
            if (alleles) parts.push(`Alleles: ${alleles}`);
          }
          // For Data Missing: show effect allele and gene (but no alleles since data is missing)
          else if (zygosity === 'Data Missing') {
            if (effectAllele) parts.push(`Effect: ${effectAllele}`);
            if (gene) parts.push(`Gene: ${gene}`);
          }

          if (parts.length > 0) {
            detailedInfo = ` <span style="font-size: 0.85em; color: #666;">(${parts.join(', ')})</span>`;
          }
        }

        if (zygosity === 'Homozygous') {
          // Red text with filled cloud icon for Homozygous
          return `${match} <span style="color: red; font-weight: bold;">☁️ Homozygous</span>${detailedInfo}`;
        } else if (zygosity === 'Heterozygous') {
          // Darker yellow text (#b8860b - dark goldenrod) with outline cloud icon for Heterozygous
          return `${match} <span style="color: #b8860b; font-weight: normal;">☁ Heterozygous</span>${detailedInfo}`;
        } else if (zygosity === 'Wild') {
          return `${match} <span style="color: black;">Wild</span>${detailedInfo}`;
        } else if (zygosity === 'Data Missing') {
          return `<span style="color: grey;">${match} [Data Missing]</span>${detailedInfo}`;
        } else if (zygosity === 'Reference Missing') {
          return `<span style="color: grey;">${match} [Reference Missing]</span>${detailedInfo}`;
        }

        return match;
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

  // Filter out SNP subsections based on showAllSubsections parameter
  if (!showAllSubsections) {
    // Original behavior: filter out subsections where all RS IDs are Data Missing or Wild
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
  }
  // If showAllSubsections is true, all subsections are shown with their RS IDs already annotated

  // Bold the entire first line of every SNP subsection (list items with RS IDs)
  const allListItems = doc.querySelectorAll('li.c1.li-bullet-0, li[class*="li-bullet"]');
  allListItems.forEach(li => {
    const text = li.textContent || '';
    const rsIds = extractRSIds(text);

    // Only bold if this list item contains RS IDs (is a SNP subsection)
    if (rsIds.length > 0) {
      // Get the first text node or find the first line
      const firstChild = li.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        const textContent = firstChild.textContent || '';
        // Find the first line break or take the whole text if no break
        const firstLineEnd = textContent.indexOf('\n');
        const firstLine = firstLineEnd !== -1 ? textContent.substring(0, firstLineEnd) : textContent;

        if (firstLine.trim()) {
          // Wrap the first line in a strong tag
          const boldSpan = doc.createElement('strong');
          boldSpan.textContent = firstLine;

          // Replace the first text node
          if (firstLineEnd !== -1) {
            const remainingText = doc.createTextNode(textContent.substring(firstLineEnd));
            li.insertBefore(boldSpan, firstChild);
            li.replaceChild(remainingText, firstChild);
          } else {
            li.replaceChild(boldSpan, firstChild);
          }
        }
      } else {
        // If the first child is not a text node, wrap all direct text content in bold
        // This handles cases where the content might already have some HTML
        const innerHTML = li.innerHTML;
        const firstLineMatch = innerHTML.match(/^([^<\n]+)/);
        if (firstLineMatch) {
          li.innerHTML = innerHTML.replace(/^([^<\n]+)/, '<strong>$1</strong>');
        }
      }
    }
  });

  // Format special text patterns: "SNPs:" (bold), "Follow-up Labs:", "Recommended Labs:" and "Recommended Actions:" (italic)
  // This needs to be done after RS ID replacements
  const allTextNodes = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  const textNodesToFormat: Array<{ node: Node; newHTML: string }> = [];

  let textNode = allTextNodes.nextNode();
  while (textNode) {
    let text = textNode.textContent || '';
    let modified = false;

    // Make "SNPs:" bold (case-insensitive)
    if (/\bSNPs:\s*/i.test(text)) {
      text = text.replace(/(\bSNPs:\s*)/gi, '<strong>$1</strong>');
      modified = true;
    }

    // Make "Follow-up Labs:", "Recommended Labs:" and "Recommended Actions:" italic (case-insensitive)
    if (/\bFollow-up\s+Labs:\s*/i.test(text)) {
      text = text.replace(/(\bFollow-up\s+Labs:\s*)/gi, '<em>$1</em>');
      modified = true;
    }
    if (/\bRecommended\s+Labs:\s*/i.test(text)) {
      text = text.replace(/(\bRecommended\s+Labs:\s*)/gi, '<em>$1</em>');
      modified = true;
    }
    if (/\bRecommended\s+Actions:\s*/i.test(text)) {
      text = text.replace(/(\bRecommended\s+Actions:\s*)/gi, '<em>$1</em>');
      modified = true;
    }

    if (modified) {
      textNodesToFormat.push({ node: textNode, newHTML: text });
    }

    textNode = allTextNodes.nextNode();
  }

  // Apply text formatting
  for (const { node, newHTML } of textNodesToFormat) {
    const span = doc.createElement('span');
    span.innerHTML = newHTML;
    node.parentNode?.replaceChild(span, node);
  }

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
    let referenceMissingCount = 0;

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
          case 'Reference Missing':
            referenceMissingCount++;
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
      referenceMissingCount,
      totalCount,
      heterozygousPercent: (heterozygousCount / totalCount) * 100,
      homozygousPercent: (homozygousCount / totalCount) * 100,
      wildPercent: (wildCount / totalCount) * 100,
      missingPercent: (missingCount / totalCount) * 100,
      referenceMissingPercent: (referenceMissingCount / totalCount) * 100
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

          // Case-insensitive check for Summary Placeholder or Summary Block
          if (text.toLowerCase().includes('summary placeholder') || text.toLowerCase().includes('summary block')) {
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
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'u', 'a', 'b', 'i', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['style', 'class', 'id', 'href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Generates Grand Summary HTML table with section links
 */
export function generateGrandSummaryHTML(summaries: SectionSummary[], showDetailedAnnotations: boolean = false): string {
  // Sort summaries by homozygous percentage (highest first)
  const sortedSummaries = [...summaries].sort((a, b) => b.homozygousPercent - a.homozygousPercent);

  // Calculate grand totals
  const grandTotals = summaries.reduce(
    (acc, summary) => ({
      totalSNPs: acc.totalSNPs + summary.totalCount,
      homozygousCount: acc.homozygousCount + summary.homozygousCount,
      heterozygousCount: acc.heterozygousCount + summary.heterozygousCount,
      wildCount: acc.wildCount + summary.wildCount,
      missingCount: acc.missingCount + summary.missingCount,
      referenceMissingCount: acc.referenceMissingCount + summary.referenceMissingCount,
    }),
    { totalSNPs: 0, homozygousCount: 0, heterozygousCount: 0, wildCount: 0, missingCount: 0, referenceMissingCount: 0 }
  );

  const snpsWithData = grandTotals.totalSNPs - grandTotals.missingCount;
  const homozygousPercent = grandTotals.totalSNPs > 0 ? (grandTotals.homozygousCount / grandTotals.totalSNPs) * 100 : 0;
  const heterozygousPercent = grandTotals.totalSNPs > 0 ? (grandTotals.heterozygousCount / grandTotals.totalSNPs) * 100 : 0;

  // Helper function to create section ID from section name
  const getSectionId = (sectionName: string) => {
    return 'section-' + sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  const rows = sortedSummaries.map(summary => {
    const sectionId = getSectionId(summary.sectionName);
    return `
      <tr>
        <td>
          <a href="#${sectionId}" style="color: #667eea; text-decoration: none; font-weight: bold;">
            ${summary.sectionName}
          </a>
        </td>
        <td>${summary.totalCount}</td>
        <td style="color: red; font-weight: bold;">
          ${summary.homozygousCount} (${summary.homozygousPercent.toFixed(1)}%)
        </td>
        <td>${summary.heterozygousCount} (${summary.heterozygousPercent.toFixed(1)}%)</td>
        <td style="color: green;">
          ${summary.wildCount} (${summary.wildPercent.toFixed(1)}%)
        </td>
        <td style="color: grey;">
          ${summary.missingCount} (${summary.missingPercent.toFixed(1)}%)
        </td>
        ${showDetailedAnnotations ? `
        <td style="color: orange;">
          ${summary.referenceMissingCount} (${summary.referenceMissingPercent.toFixed(1)}%)
        </td>
        ` : ''}
      </tr>
    `;
  }).join('');

  return `
    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #1f2937;">Grand Summary</h2>
      <p style="margin: 10px 0; padding: 15px; background-color: white; border-radius: 5px; border-left: 4px solid #667eea;">
        <strong>Total SNPs in template:</strong> ${grandTotals.totalSNPs} | 
        <strong>SNPs with data:</strong> ${snpsWithData} | 
        <strong style="color: red;">Homozygous:</strong> ${grandTotals.homozygousCount} (${homozygousPercent.toFixed(1)}%) | 
        <strong>Heterozygous:</strong> ${grandTotals.heterozygousCount} (${heterozygousPercent.toFixed(1)}%)
      </p>
      <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Section</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Total SNPs</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Homozygous</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Heterozygous</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Wild Type</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Data Missing</th>
            ${showDetailedAnnotations ? '<th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Reference Missing</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
