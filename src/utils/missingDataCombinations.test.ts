import { describe, it, expect } from 'vitest';
import { determineZygosity, getSNPResults } from './templateProcessor';
import type { AlleleData, GeneticData } from '../types';

/**
 * Comprehensive tests for all combinations of missing genome data and missing effect allele
 *
 * Test Matrix:
 * 1. Genome Data Present + Effect Allele Present → Normal zygosity determination
 * 2. Genome Data Present + Effect Allele Missing → Fallback to basic logic
 * 3. Genome Data Missing + Effect Allele Present → Data Missing
 * 4. Genome Data Missing + Effect Allele Missing → Data Missing
 */
describe('Missing Data Combinations - Comprehensive Coverage', () => {

  describe('Case 1: Genome Data Present + Effect Allele Present', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS123',
        gene: 'TEST',
        problemAllele: 'G', // Effect allele IS present
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should detect Homozygous when both alleles match effect allele', () => {
      // Genome: GG, Effect: G
      const result = determineZygosity('G', 'G', 'RS123', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should detect Heterozygous when one allele matches effect allele', () => {
      // Genome: GA, Effect: G
      const result = determineZygosity('G', 'A', 'RS123', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Wild when neither allele matches effect allele', () => {
      // Genome: AA, Effect: G
      const result = determineZygosity('A', 'A', 'RS123', {}, alleleReference);
      expect(result).toBe('Wild');
    });
  });

  describe('Case 2: Genome Data Present + Effect Allele Missing (Empty String)', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS456',
        gene: 'TEST',
        problemAllele: '', // Effect allele IS empty
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should return Reference Missing when both alleles are the same', () => {
      // Genome: AA, Effect: (empty) → Cannot determine zygosity
      const result = determineZygosity('A', 'A', 'RS456', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });

    it('should return Reference Missing when alleles are different', () => {
      // Genome: AG, Effect: (empty) → Cannot determine zygosity
      const result = determineZygosity('A', 'G', 'RS456', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });
  });

  describe('Case 2b: Genome Data Present + Effect Allele Missing (Undefined)', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS789',
        gene: 'TEST',
        problemAllele: '', // effectively undefined
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should return Reference Missing when both alleles are the same', () => {
      // Genome: TT, Effect: (undefined) → Cannot determine zygosity
      const result = determineZygosity('T', 'T', 'RS789', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });

    it('should return Reference Missing when alleles are different', () => {
      // Genome: TC, Effect: (undefined) → Cannot determine zygosity
      const result = determineZygosity('T', 'C', 'RS789', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });
  });

  describe('Case 2c: Genome Data Present + RS ID Not in Reference', () => {
    const alleleReference: AlleleData[] = []; // Empty reference

    it('should return Reference Missing when both alleles are the same', () => {
      // Genome: CC, Effect: (not in reference) → Cannot determine zygosity
      const result = determineZygosity('C', 'C', 'RS999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });

    it('should return Reference Missing when alleles are different', () => {
      // Genome: CG, Effect: (not in reference) → Cannot determine zygosity
      const result = determineZygosity('C', 'G', 'RS999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });
  });

  describe('Case 3: Genome Data Missing + Effect Allele Present', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS111',
        gene: 'TEST',
        problemAllele: 'A', // Effect allele IS present
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should return Data Missing when allele1 is dash', () => {
      // Genome: -G, Effect: A
      const result = determineZygosity('-', 'G', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele2 is dash', () => {
      // Genome: G-, Effect: A
      const result = determineZygosity('G', '-', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when both alleles are dashes', () => {
      // Genome: --, Effect: A
      const result = determineZygosity('-', '-', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele1 is empty string', () => {
      // Genome: (empty)G, Effect: A
      const result = determineZygosity('', 'G', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when allele2 is empty string', () => {
      // Genome: G(empty), Effect: A
      const result = determineZygosity('G', '', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when both alleles are empty strings', () => {
      // Genome: (empty)(empty), Effect: A
      const result = determineZygosity('', '', 'RS111', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('Case 4: Genome Data Missing + Effect Allele Missing (Empty String)', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS222',
        gene: 'TEST',
        problemAllele: '', // Effect allele IS empty
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should return Data Missing when allele1 is dash', () => {
      // Genome: -G, Effect: (empty)
      const result = determineZygosity('-', 'G', 'RS222', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when both alleles are empty strings', () => {
      // Genome: (empty)(empty), Effect: (empty)
      const result = determineZygosity('', '', 'RS222', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('Case 4b: Genome Data Missing + Effect Allele Missing (Undefined)', () => {
    const alleleReference: AlleleData[] = [
      {
        rsId: 'RS333',
        gene: 'TEST',
        problemAllele: '', // effectively undefined
        wildAllele: '',
        confirmationUrl: ''
      }
    ];

    it('should return Data Missing when genome alleles are dashes', () => {
      // Genome: --, Effect: (undefined)
      const result = determineZygosity('-', '-', 'RS333', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when genome alleles are empty', () => {
      // Genome: (empty)(empty), Effect: (undefined)
      const result = determineZygosity('', '', 'RS333', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('Case 4c: Genome Data Missing + RS ID Not in Reference', () => {
    const alleleReference: AlleleData[] = []; // Empty reference

    it('should return Data Missing when genome alleles are dashes', () => {
      // Genome: --, Effect: (not in reference)
      const result = determineZygosity('-', '-', 'RS444', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should return Data Missing when genome alleles are empty', () => {
      // Genome: (empty)(empty), Effect: (not in reference)
      const result = determineZygosity('', '', 'RS444', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('getSNPResults - Integration Tests for Missing Data', () => {
    it('should return Data Missing when genome data is absent + effect allele present', () => {
      const alleleReference: AlleleData[] = [
        { rsId: 'RS500', gene: 'TEST', problemAllele: 'G', wildAllele: '', confirmationUrl: '' }
      ];
      const geneticData: GeneticData = {}; // No genome data for RS500

      const results = getSNPResults(['RS500'], geneticData, {}, alleleReference);
      const result = results.get('RS500');

      expect(result?.zygosity).toBe('Data Missing');
      expect(result?.alleles).toBe('--');
      expect(result?.effectAllele).toBe('G'); // Effect allele is still shown
      expect(result?.gene).toBe('TEST');
    });

    it('should return Data Missing when genome data is absent + effect allele missing', () => {
      const alleleReference: AlleleData[] = [
        { rsId: 'RS600', gene: 'TEST', problemAllele: '', wildAllele: '', confirmationUrl: '' }
      ];
      const geneticData: GeneticData = {}; // No genome data for RS600

      const results = getSNPResults(['RS600'], geneticData, {}, alleleReference);
      const result = results.get('RS600');

      expect(result?.zygosity).toBe('Data Missing');
      expect(result?.alleles).toBe('--');
      expect(result?.effectAllele).toBe(''); // Empty effect allele
      expect(result?.gene).toBe('TEST');
    });

    it('should return Data Missing when genome data is absent + RS ID not in reference', () => {
      const alleleReference: AlleleData[] = [];
      const geneticData: GeneticData = {}; // No genome data for RS700

      const results = getSNPResults(['RS700'], geneticData, {}, alleleReference);
      const result = results.get('RS700');

      expect(result?.zygosity).toBe('Data Missing');
      expect(result?.alleles).toBe('--');
      expect(result?.effectAllele).toBeUndefined(); // No reference data
      expect(result?.gene).toBeUndefined();
    });

    it('should use Reference Missing when genome data present + effect allele missing', () => {
      const alleleReference: AlleleData[] = [
        { rsId: 'RS800', gene: 'TEST', problemAllele: '', wildAllele: '', confirmationUrl: '' }
      ];
      const geneticData: GeneticData = {
        'RS800': { allele1: 'A', allele2: 'A' }
      };

      const results = getSNPResults(['RS800'], geneticData, {}, alleleReference);
      const result = results.get('RS800');

      expect(result?.zygosity).toBe('Reference Missing'); // Cannot determine without effect allele
      expect(result?.alleles).toBe('AA');
      expect(result?.effectAllele).toBe(''); // Empty effect allele
      expect(result?.gene).toBe('TEST');
    });
  });
});
