import { describe, it, expect } from 'vitest';
import {
  extractRSIds,
  determineZygosity,
  getSNPResults,
  transformTemplate,
  calculateSectionSummaries,
  generateGrandSummaryHTML
} from './templateProcessor';
import type { AlleleData, GeneticData, SNPResult } from '../types';

describe('extractRSIds', () => {
  it('should extract RS IDs from content', () => {
    const content = 'This is about RS4880 and RS1050450 genes';
    const result = extractRSIds(content);
    expect(result).toEqual(['RS4880', 'RS1050450']);
  });

  it('should handle case insensitive RS IDs', () => {
    const content = 'Testing rs4880 and RS1050450';
    const result = extractRSIds(content);
    expect(result).toEqual(['RS4880', 'RS1050450']);
  });

  it('should remove duplicates', () => {
    const content = 'RS4880 is important, RS4880 again';
    const result = extractRSIds(content);
    expect(result).toEqual(['RS4880']);
  });

  it('should return empty array when no RS IDs found', () => {
    const content = 'No genetic markers here';
    const result = extractRSIds(content);
    expect(result).toEqual([]);
  });

  it('should handle multiple digit RS IDs', () => {
    const content = 'RS123 and RS123456789';
    const result = extractRSIds(content);
    expect(result).toEqual(['RS123', 'RS123456789']);
  });
});

describe('determineZygosity', () => {
  const alleleReference: AlleleData[] = [
    {
      rsId: 'RS4880',
      wildAllele: 'T',
      problemAllele: 'C',
      confirmationUrl: 'https://example.com'
    },
    {
      rsId: 'RS1050450',
      wildAllele: 'C',
      problemAllele: 'T',
      confirmationUrl: 'https://example.com'
    },
    {
      rsId: 'RS713041',
      wildAllele: 'G',
      problemAllele: 'A',
      confirmationUrl: 'https://example.com'
    }
  ];

  describe('Homozygous detection', () => {
    it('should return Homozygous when both alleles match and are the problem allele', () => {
      const result = determineZygosity('C', 'C', 'RS4880', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should return Homozygous for different RS ID with problem allele', () => {
      const result = determineZygosity('T', 'T', 'RS1050450', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should return Homozygous for third RS ID with problem allele', () => {
      const result = determineZygosity('A', 'A', 'RS713041', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });
  });

  describe('Heterozygous detection', () => {
    it('should return Heterozygous when alleles differ and one is problem allele', () => {
      const result = determineZygosity('T', 'C', 'RS4880', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should return Heterozygous when alleles are reversed', () => {
      const result = determineZygosity('C', 'T', 'RS4880', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should return Heterozygous for RS1050450 with mixed alleles', () => {
      const result = determineZygosity('C', 'T', 'RS1050450', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should return Heterozygous for RS713041 with mixed alleles', () => {
      const result = determineZygosity('G', 'A', 'RS713041', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });
  });

  describe('Wild type detection', () => {
    it('should return Wild when neither allele is the problem allele', () => {
      const result = determineZygosity('T', 'T', 'RS4880', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should return Wild for RS1050450 with wild alleles', () => {
      const result = determineZygosity('C', 'C', 'RS1050450', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should return Wild for RS713041 with wild alleles', () => {
      const result = determineZygosity('G', 'G', 'RS713041', {}, alleleReference);
      expect(result).toBe('Wild');
    });
  });

  describe('Data Missing detection', () => {
    it('should return Data Missing when allele1 is missing', () => {
      const result = determineZygosity('-', 'C', 'RS4880', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele2 is missing', () => {
      const result = determineZygosity('C', '-', 'RS4880', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when both alleles are missing', () => {
      const result = determineZygosity('-', '-', 'RS4880', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele1 is empty string', () => {
      const result = determineZygosity('', 'C', 'RS4880', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele2 is empty string', () => {
      const result = determineZygosity('C', '', 'RS4880', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('Unknown RS ID handling', () => {
    it('should return Reference Missing for matching alleles when RS ID not in reference', () => {
      const result = determineZygosity('A', 'A', 'RS999999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });

    it('should return Reference Missing for different alleles when RS ID not in reference', () => {
      const result = determineZygosity('A', 'G', 'RS999999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });
  });

  describe('Case sensitivity', () => {
    it('should handle lowercase alleles correctly', () => {
      const result = determineZygosity('c', 'c', 'RS4880', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should handle mixed case RS IDs', () => {
      const result = determineZygosity('C', 'C', 'rs4880', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });
  });
});

describe('getSNPResults', () => {
  const alleleReference: AlleleData[] = [
    {
      rsId: 'RS4880',
      wildAllele: 'T',
      problemAllele: 'C',
      confirmationUrl: 'https://example.com'
    },
    {
      rsId: 'RS1050450',
      wildAllele: 'C',
      problemAllele: 'T',
      confirmationUrl: 'https://example.com'
    }
  ];

  const geneticData: GeneticData = {
    'RS4880': { allele1: 'C', allele2: 'C' },
    'RS1050450': { allele1: 'C', allele2: 'T' },
    'RS713041': { allele1: 'G', allele2: 'G' }
  };

  it('should get SNP results for multiple RS IDs', () => {
    const rsIds = ['RS4880', 'RS1050450'];
    const results = getSNPResults(rsIds, geneticData, {}, alleleReference);

    expect(results.size).toBe(2);
    expect(results.get('RS4880')).toEqual({
      rsId: 'RS4880',
      zygosity: 'Homozygous',
      alleles: 'CC',
      effectAllele: 'C',
      gene: undefined
    });
    expect(results.get('RS1050450')).toEqual({
      rsId: 'RS1050450',
      zygosity: 'Heterozygous',
      alleles: 'CT',
      effectAllele: 'T',
      gene: undefined
    });
  });

  it('should return Data Missing for RS IDs not in genetic data', () => {
    const rsIds = ['RS999999'];
    const results = getSNPResults(rsIds, geneticData, {}, alleleReference);

    expect(results.get('RS999999')).toEqual({
      rsId: 'RS999999',
      zygosity: 'Data Missing',
      alleles: '--',
      effectAllele: undefined,
      gene: undefined
    });
  });

  it('should handle mixed case RS IDs', () => {
    const rsIds = ['rs4880', 'RS1050450'];
    const results = getSNPResults(rsIds, geneticData, {}, alleleReference);

    expect(results.has('RS4880')).toBe(true);
    expect(results.has('RS1050450')).toBe(true);
  });

  it('should correctly determine Reference Missing when RS ID not in reference', () => {
    const rsIds = ['RS713041'];
    const results = getSNPResults(rsIds, geneticData, {}, alleleReference);

    // RS713041 has G/G but no reference data, so it should be Reference Missing
    expect(results.get('RS713041')?.zygosity).toBe('Reference Missing');
  });
});

describe('transformTemplate', () => {
  it('should replace RS IDs with formatted results', () => {
    const htmlContent = '<p>Testing RS4880 marker</p>';
    const snpResults = new Map<string, SNPResult>([
      ['RS4880', { rsId: 'RS4880', zygosity: 'Homozygous' as const, alleles: 'CC' }]
    ]);

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).toContain('RS4880');
    expect(result).toContain('☁️ Homozygous');
    expect(result).toContain('color: red');
    expect(result).toContain('font-weight: bold');
  });

  it('should format Heterozygous results correctly', () => {
    const htmlContent = '<p>Testing RS4880 marker</p>';
    const snpResults = new Map<string, SNPResult>([
      ['RS4880', { rsId: 'RS4880', zygosity: 'Heterozygous' as const, alleles: 'CT' }]
    ]);

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).toContain('☁ Heterozygous');
    expect(result).toContain('color: #b8860b');
  });

  it('should format Wild type results correctly', () => {
    const htmlContent = '<p>Testing RS4880 marker</p>';
    const snpResults = new Map<string, SNPResult>([
      ['RS4880', { rsId: 'RS4880', zygosity: 'Wild' as const, alleles: 'TT' }]
    ]);

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).toContain('Wild');
    expect(result).not.toContain('☁');
  });

  it('should format Data Missing results correctly', () => {
    const htmlContent = '<p>Testing RS4880 marker</p>';
    const snpResults = new Map<string, SNPResult>([
      ['RS4880', { rsId: 'RS4880', zygosity: 'Data Missing' as const, alleles: '--' }]
    ]);

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).toContain('[Data Missing]');
    expect(result).toContain('color: grey');
  });

  it('should add IDs to h3 section headings', () => {
    const htmlContent = '<h3>Methylation Section</h3><p>Content</p>';
    const snpResults = new Map();

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).toContain('id="section-methylation-section"');
  });

  it('should not add IDs to intro sections', () => {
    const htmlContent = '<h3>Introduction</h3><p>Content</p>';
    const snpResults = new Map();

    const result = transformTemplate(htmlContent, snpResults);

    expect(result).not.toContain('id=');
  });
});

describe('calculateSectionSummaries', () => {
  const snpResults = new Map<string, SNPResult>([
    ['RS4880', { rsId: 'RS4880', zygosity: 'Homozygous' as const, alleles: 'CC' }],
    ['RS1050450', { rsId: 'RS1050450', zygosity: 'Heterozygous' as const, alleles: 'CT' }],
    ['RS713041', { rsId: 'RS713041', zygosity: 'Wild' as const, alleles: 'GG' }],
    ['RS999999', { rsId: 'RS999999', zygosity: 'Data Missing' as const, alleles: '--' }]
  ]);

  it('should calculate summaries for sections with RS IDs', () => {
    const htmlContent = `
      <h3>Methylation</h3>
      <p>RS4880 and RS1050450 are important</p>
      <h3>Another Section</h3>
      <p>RS713041 matters</p>
    `;

    const summaries = calculateSectionSummaries(htmlContent, snpResults);

    expect(summaries).toHaveLength(2);
    expect(summaries[0].sectionName).toBe('Methylation');
    expect(summaries[0].totalCount).toBe(2);
    expect(summaries[0].homozygousCount).toBe(1);
    expect(summaries[0].heterozygousCount).toBe(1);
  });

  it('should skip intro sections', () => {
    const htmlContent = `
      <h3>Introduction</h3>
      <p>RS4880 mentioned here</p>
      <h3>Real Section</h3>
      <p>RS1050450 here</p>
    `;

    const summaries = calculateSectionSummaries(htmlContent, snpResults);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].sectionName).toBe('Real Section');
  });

  it('should calculate percentages correctly', () => {
    const htmlContent = `
      <h3>Test Section</h3>
      <p>RS4880, RS1050450, RS713041, RS999999</p>
    `;

    const summaries = calculateSectionSummaries(htmlContent, snpResults);

    expect(summaries[0].homozygousPercent).toBe(25);
    expect(summaries[0].heterozygousPercent).toBe(25);
    expect(summaries[0].wildPercent).toBe(25);
    expect(summaries[0].missingPercent).toBe(25);
  });

  it('should skip sections with no RS IDs', () => {
    const htmlContent = `
      <h3>Empty Section</h3>
      <p>No genetic markers here</p>
    `;

    const summaries = calculateSectionSummaries(htmlContent, snpResults);

    expect(summaries).toHaveLength(0);
  });
});

describe('generateGrandSummaryHTML', () => {
  const summaries = [
    {
      sectionName: 'Methylation',
      heterozygousCount: 5,
      homozygousCount: 10,
      wildCount: 3,
      missingCount: 2,
      referenceMissingCount: 0,
      totalCount: 20,
      heterozygousPercent: 25,
      homozygousPercent: 50,
      wildPercent: 15,
      missingPercent: 10,
      referenceMissingPercent: 0
    },
    {
      sectionName: 'Detoxification',
      heterozygousCount: 2,
      homozygousCount: 3,
      wildCount: 5,
      missingCount: 0,
      referenceMissingCount: 0,
      totalCount: 10,
      heterozygousPercent: 20,
      homozygousPercent: 30,
      wildPercent: 50,
      missingPercent: 0,
      referenceMissingPercent: 0
    }
  ];

  it('should generate HTML table with section links', () => {
    const html = generateGrandSummaryHTML(summaries);

    expect(html).toContain('Grand Summary');
    expect(html).toContain('<table');
    expect(html).toContain('Methylation');
    expect(html).toContain('Detoxification');
  });

  it('should include correct statistics', () => {
    const html = generateGrandSummaryHTML(summaries);

    expect(html).toContain('10 (50.0%)'); // Methylation homozygous
    expect(html).toContain('3 (30.0%)'); // Detoxification homozygous
  });

  it('should create anchor links to sections', () => {
    const html = generateGrandSummaryHTML(summaries);

    expect(html).toContain('href="#section-methylation"');
    expect(html).toContain('href="#section-detoxification"');
  });

  it('should sort by homozygous percentage (highest first)', () => {
    const html = generateGrandSummaryHTML(summaries);
    const methylationIndex = html.indexOf('Methylation');
    const detoxificationIndex = html.indexOf('Detoxification');

    // Methylation (50%) should appear before Detoxification (30%)
    expect(methylationIndex).toBeLessThan(detoxificationIndex);
  });

  it('should handle empty summaries array', () => {
    const html = generateGrandSummaryHTML([]);

    expect(html).toContain('Grand Summary');
    expect(html).toContain('<table');
    expect(html).not.toContain('<tr>'); // No data rows, only header
  });
});
