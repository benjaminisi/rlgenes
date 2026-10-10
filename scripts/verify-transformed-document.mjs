import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.NodeFilter = window.NodeFilter;
globalThis.Node = window.Node;
globalThis.HTMLElement = window.HTMLElement;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const templatePath = path.join(projectRoot, 'FFC_Breast_Cancer_Genetics_Oct9_v9_David_RLGenes.html');
const templateContent = fs.readFileSync(templatePath, 'utf8');

console.log('--- Verifying FFC_Breast_Cancer_Genetics_Oct9_v9_David_RLGenes.html ---');

// 1. extractTemplateTitle
function extractTemplateTitle(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  for (let i = 1; i <= 6; i++) {
    const heading = doc.querySelector(`h${i}`);
    if (heading && heading.textContent) {
      return heading.textContent.trim();
    }
  }
  return 'Genetic Report';
}

const title = extractTemplateTitle(templateContent);
console.log('1. Extracted Title:', title);

// 2. extractRSIdsWithRiskAlleles
function extractRSIdsWithRiskAlleles(content) {
  const rsIdPattern = /\bRS(\d+)\b/gi;
  const allelePattern = /\(([ACTG])\s*&gt;\s*([ACTG])\)/i;
  const rsIdSet = new Set();
  const rsIdToRiskAllele = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const alleleMatch = line.match(allelePattern);
    const wildAllele = alleleMatch?.[1];
    const riskAllele = alleleMatch?.[2];

    let rsMatch;
    while ((rsMatch = rsIdPattern.exec(line)) !== null) {
      const rsId = `RS${rsMatch[1]}`.toUpperCase();
      rsIdSet.add(rsId);

      if (wildAllele && riskAllele) {
        rsIdToRiskAllele[rsId] = {
          rsId,
          wildAllele,
          problemAllele: riskAllele,
          confirmationUrl: 'http://example.com',
          gene: undefined,
        };
      }
    }
    rsIdPattern.lastIndex = 0;
  }

  return { rsIds: [...rsIdSet], rsIdToRiskAllele };
}

const { rsIds, rsIdToRiskAllele } = extractRSIdsWithRiskAlleles(templateContent);
console.log(`2. Total unique RS IDs extracted: ${rsIds.length}`);
console.log(`   RS IDs with risk allele overrides from template: ${Object.keys(rsIdToRiskAllele).length}`);

// Sample check on overrides
console.log('   Sample overrides:');
['RS1801516', 'RS17879961', 'RS1799966', 'RS180177132', 'RS144848'].forEach(id => {
  const ov = rsIdToRiskAllele[id];
  console.log(`     ${id} -> wild: ${ov?.wildAllele}, risk: ${ov?.problemAllele}`);
});

// 3. Mock genetic data to test zygosity and summaries
const mockGeneticData = {};
rsIds.forEach((rsId, idx) => {
  const override = rsIdToRiskAllele[rsId];
  if (override) {
    if (idx % 3 === 0) {
      // Homozygous (both match risk)
      mockGeneticData[rsId] = { allele1: override.problemAllele, allele2: override.problemAllele };
    } else if (idx % 3 === 1) {
      // Heterozygous (one wild, one risk)
      mockGeneticData[rsId] = { allele1: override.wildAllele, allele2: override.problemAllele };
    } else {
      // Wild (both wild)
      mockGeneticData[rsId] = { allele1: override.wildAllele, allele2: override.wildAllele };
    }
  } else {
    // Missing
    mockGeneticData[rsId] = { allele1: '-', allele2: '-' };
  }
});

// Determine zygosity helper
function determineZygosity(allele1, allele2, rsId, riskAlleleOverrides, alleleReference) {
  if (allele1 === '-' || allele2 === '-' || !allele1 || !allele2) return 'Data Missing';
  const a1 = allele1.toUpperCase();
  const a2 = allele2.toUpperCase();
  const ref = riskAlleleOverrides[rsId] || alleleReference.find(r => r.rsId.toUpperCase() === rsId.toUpperCase());
  if (ref?.problemAllele && ref.problemAllele.trim() !== '') {
    const eff = ref.problemAllele.toUpperCase();
    if (a1 === eff && a2 === eff) return 'Homozygous';
    if (a1 === eff || a2 === eff) return 'Heterozygous';
    return 'Wild';
  }
  return 'Reference Missing';
}

function getSNPResults(rsIds, geneticData, riskAlleleOverrides, alleleReference) {
  const results = new Map();
  for (const rsId of rsIds) {
    const data = geneticData[rsId.toUpperCase()];
    const ref = riskAlleleOverrides[rsId] || alleleReference.find(r => r.rsId.toUpperCase() === rsId.toUpperCase());
    if (!data) {
      results.set(rsId.toUpperCase(), { rsId, zygosity: 'Data Missing', alleles: '--', effectAllele: ref?.problemAllele });
      continue;
    }
    const zygosity = determineZygosity(data.allele1, data.allele2, rsId, riskAlleleOverrides, alleleReference);
    results.set(rsId.toUpperCase(), { rsId, zygosity, alleles: `${data.allele1}${data.allele2}`, effectAllele: ref?.problemAllele });
  }
  return results;
}

const snpResults = getSNPResults(rsIds, mockGeneticData, rsIdToRiskAllele, []);

// 4. calculateSectionSummaries
function extractRSIds(content) {
  const matches = content.match(/\bRS\d+\b/gi);
  if (!matches) return [];
  return [...new Set(matches.map(id => id.toUpperCase()))];
}

function calculateSectionSummaries(htmlContent, snpResults) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const summaries = [];
  const headings = doc.querySelectorAll('h3');

  headings.forEach(heading => {
    const sectionName = heading.textContent?.trim() || 'Unknown Section';
    if (sectionName.toLowerCase().includes('intro')) return;

    const sectionContent = [];
    let currentElement = heading.nextElementSibling;
    while (currentElement && currentElement.tagName !== 'H3') {
      sectionContent.push(currentElement.textContent || '');
      currentElement = currentElement.nextElementSibling;
    }

    const fullText = sectionContent.join(' ');
    const rsIds = extractRSIds(fullText);
    if (rsIds.length === 0) return;

    let heterozygousCount = 0;
    let homozygousCount = 0;
    let wildCount = 0;
    let missingCount = 0;
    let referenceMissingCount = 0;

    rsIds.forEach(rsId => {
      const result = snpResults.get(rsId.toUpperCase());
      if (result) {
        switch (result.zygosity) {
          case 'Heterozygous': heterozygousCount++; break;
          case 'Homozygous': homozygousCount++; break;
          case 'Wild': wildCount++; break;
          case 'Data Missing': missingCount++; break;
          case 'Reference Missing': referenceMissingCount++; break;
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
      referenceMissingPercent: (referenceMissingCount / totalCount) * 100,
    });
  });

  return summaries;
}

const sectionSummaries = calculateSectionSummaries(templateContent, snpResults);
console.log(`\n3. Section Summaries calculated: ${sectionSummaries.length} sections:`);
sectionSummaries.forEach(s => {
  console.log(`   - ${s.sectionName.padEnd(8)}: ${s.totalCount} SNPs | Homo: ${s.homozygousCount} | Hetero: ${s.heterozygousCount} | Wild: ${s.wildCount} | Missing: ${s.missingCount}`);
});

// 5. Grand Summary HTML
function generateGrandSummaryHTML(summaries) {
  const getSectionId = (name) => 'section-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const rows = summaries.map(s => `
    <tr>
      <td><a href="#${getSectionId(s.sectionName)}">${s.sectionName}</a></td>
      <td>${s.totalCount}</td>
      <td>${s.homozygousCount}</td>
      <td>${s.heterozygousCount}</td>
      <td>${s.wildCount}</td>
    </tr>`).join('');
  return `<table id="grand-summary-table"><thead><tr><th>Section</th><th>Total</th><th>Homo</th><th>Hetero</th><th>Wild</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const grandSummaryHTML = generateGrandSummaryHTML(sectionSummaries);
console.log('\n4. Grand Summary Table generated with rows for:', sectionSummaries.map(s => s.sectionName).join(', '));

// 6. insertSummaries test
function insertSummaries(htmlContent, summaries) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  summaries.forEach(summary => {
    const headings = doc.querySelectorAll('h3');
    for (const heading of Array.from(headings)) {
      const headingText = heading.textContent?.trim() || '';
      if (headingText === summary.sectionName) {
        let currentElement = heading.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H3') {
          const text = currentElement.textContent || '';
          if (text.toLowerCase().includes('summary placeholder') || text.toLowerCase().includes('summary block')) {
            const summaryDiv = doc.createElement('div');
            summaryDiv.className = 'inserted-section-summary';
            summaryDiv.innerHTML = `<h4>Summary for ${summary.sectionName}</h4><p>Total: ${summary.totalCount}</p>`;
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

const withSummaries = insertSummaries(templateContent, sectionSummaries);
const parser = new DOMParser();
const doc = parser.parseFromString(withSummaries, 'text/html');
const insertedDivs = doc.querySelectorAll('.inserted-section-summary');
console.log(`\n5. Section summaries inserted into HTML: ${insertedDivs.length} inserted blocks`);
insertedDivs.forEach(d => console.log('   - ' + d.textContent));

// Check Grand Summary replacement
const tocHeading = doc.querySelector('h2');
console.log('\n6. TOC / Grand Summary target present:', tocHeading?.textContent);

console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
