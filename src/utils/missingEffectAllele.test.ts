import { describe, it, expect } from 'vitest';
import { getSNPResults } from './templateProcessor';
import type { AlleleData, GeneticData } from '../types';

/**
 * Test what appears in the report when effect allele is missing
 */
describe('Report Output with Missing Effect Allele', () => {
  it('should use Reference Missing when genome data present + effect allele is empty', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS123456',
        gene: 'TEST',
        problemAllele: '', // Empty effect allele
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    const geneticData: GeneticData = {
      'RS123456': { allele1: 'A', allele2: 'A' }
    };

    const results = getSNPResults(['RS123456'], geneticData, alleleReference);
    const result = results.get('RS123456');

    expect(result).toBeDefined();
    expect(result?.effectAllele).toBe(''); // Empty string
    expect(result?.zygosity).toBe('Reference Missing'); // ✅ Cannot determine without effect allele
    expect(result?.alleles).toBe('AA');
  });

  it('should use Reference Missing when problemAllele is undefined', () => {
    const alleleReference: any[] = [
      {
        rsId: 'RS789012',
        gene: 'TEST2',
        // problemAllele is undefined/missing
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    const geneticData: GeneticData = {
      'RS789012': { allele1: 'A', allele2: 'A' }
    };

    const results = getSNPResults(['RS789012'], geneticData, alleleReference);
    const result = results.get('RS789012');

    expect(result).toBeDefined();
    expect(result?.effectAllele).toBeUndefined();
    expect(result?.zygosity).toBe('Reference Missing'); // ✅ Cannot determine without effect allele
  });

  it('should return Reference Missing for different alleles when effect allele is missing', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS123456',
        gene: 'TEST',
        problemAllele: '', // Empty effect allele
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    const geneticData: GeneticData = {
      'RS123456': { allele1: 'A', allele2: 'G' }
    };

    const results = getSNPResults(['RS123456'], geneticData, alleleReference);
    const result = results.get('RS123456');

    expect(result).toBeDefined();
    expect(result?.effectAllele).toBe(''); // Empty string
    expect(result?.zygosity).toBe('Reference Missing'); // ✅ Cannot determine without effect allele
    expect(result?.alleles).toBe('AG');
  });

  it('should handle missing effect allele when data is missing', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS123456',
        gene: 'TEST',
        problemAllele: '', // Empty effect allele
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    const geneticData: GeneticData = {};

    const results = getSNPResults(['RS123456'], geneticData, alleleReference);
    const result = results.get('RS123456');

    expect(result).toBeDefined();
    expect(result?.effectAllele).toBe(''); // Empty string
    expect(result?.zygosity).toBe('Data Missing');
    expect(result?.alleles).toBe('--');
  });

  it('should use Reference Missing when RS ID is not in reference at all', () => {
    const alleleReference: AlleleData[] = []; // Empty reference

    const geneticData: GeneticData = {
      'RS999999': { allele1: 'T', allele2: 'T' }
    };

    const results = getSNPResults(['RS999999'], geneticData, alleleReference);
    const result = results.get('RS999999');

    expect(result).toBeDefined();
    expect(result?.effectAllele).toBeUndefined();
    expect(result?.gene).toBeUndefined();
    expect(result?.zygosity).toBe('Reference Missing'); // ✅ Cannot determine without effect allele
    expect(result?.alleles).toBe('TT');
  });
});
