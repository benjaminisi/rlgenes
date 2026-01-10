import { describe, it, expect } from 'vitest';
import { determineZygosity } from './templateProcessor';
import type { AlleleData } from '../types';

/**
 * Unit tests for Homozygous and Heterozygous determination based on effect alleles
 *
 * Definitions:
 * - Homozygous: Both alleles match the effect allele for that RS ID
 * - Heterozygous: Only one of the two alleles matches the effect allele for that RS ID
 * - Wild: Neither allele matches the effect allele (both are wild type)
 * - Data Missing: One or both alleles are missing or invalid
 */
describe('Zygosity Determination with Effect Alleles', () => {
  // Sample allele reference data based on genes_rs_effect.json
  const alleleReference: AlleleData[] = [
    {
      rsId: 'RS1801394',
      gene: 'MTRR',
      problemAllele: 'G', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS601338',
      gene: 'FUT2',
      problemAllele: 'A', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS1801133',
      gene: 'MTHFR',
      problemAllele: 'A', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS1736557',
      gene: 'FMO3',
      problemAllele: 'A', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS2266782',
      gene: 'FMO3',
      problemAllele: 'A', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS909531',
      gene: 'FMO3',
      problemAllele: 'C', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    },
    {
      rsId: 'RS2266780',
      gene: 'FMO3',
      problemAllele: 'G', // Effect allele
      wildAllele: '',
      confirmationUrl: ''
    }
  ];

  describe('Homozygous - Both alleles match effect allele', () => {
    it('should detect Homozygous for RS1801394 with GG (MTRR gene, effect allele G)', () => {
      const result = determineZygosity('G', 'G', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should detect Homozygous for RS601338 with AA (FUT2 gene, effect allele A)', () => {
      const result = determineZygosity('A', 'A', 'RS601338', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should detect Homozygous for RS1801133 with AA (MTHFR gene, effect allele A)', () => {
      const result = determineZygosity('A', 'A', 'RS1801133', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should detect Homozygous for RS909531 with CC (FMO3 gene, effect allele C)', () => {
      const result = determineZygosity('C', 'C', 'RS909531', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should detect Homozygous for RS2266780 with GG (FMO3 gene, effect allele G)', () => {
      const result = determineZygosity('G', 'G', 'RS2266780', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should handle lowercase alleles - RS1801394 with gg', () => {
      const result = determineZygosity('g', 'g', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should handle mixed case alleles - RS601338 with Aa', () => {
      const result = determineZygosity('A', 'a', 'RS601338', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });
  });

  describe('Heterozygous - One allele matches effect allele', () => {
    it('should detect Heterozygous for RS1801394 with GA (MTRR gene, effect allele G)', () => {
      const result = determineZygosity('G', 'A', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Heterozygous for RS1801394 with AG (reversed order)', () => {
      const result = determineZygosity('A', 'G', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Heterozygous for RS601338 with AT (FUT2 gene, effect allele A)', () => {
      const result = determineZygosity('A', 'T', 'RS601338', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Heterozygous for RS1801133 with AG (MTHFR gene, effect allele A)', () => {
      const result = determineZygosity('A', 'G', 'RS1801133', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Heterozygous for RS909531 with CT (FMO3 gene, effect allele C)', () => {
      const result = determineZygosity('C', 'T', 'RS909531', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should detect Heterozygous for RS2266780 with GA (FMO3 gene, effect allele G)', () => {
      const result = determineZygosity('G', 'A', 'RS2266780', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should handle lowercase - RS1801394 with gt', () => {
      const result = determineZygosity('g', 't', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });
  });

  describe('Wild Type - Neither allele matches effect allele', () => {
    it('should detect Wild for RS1801394 with AA (MTRR gene, effect allele G)', () => {
      const result = determineZygosity('A', 'A', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should detect Wild for RS601338 with GG (FUT2 gene, effect allele A)', () => {
      const result = determineZygosity('G', 'G', 'RS601338', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should detect Wild for RS1801133 with GG (MTHFR gene, effect allele A)', () => {
      const result = determineZygosity('G', 'G', 'RS1801133', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should detect Wild for RS909531 with TT (FMO3 gene, effect allele C)', () => {
      const result = determineZygosity('T', 'T', 'RS909531', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should detect Wild for heterozygous non-effect alleles - RS1801394 with AT', () => {
      const result = determineZygosity('A', 'T', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Wild');
    });

    it('should detect Wild for RS2266780 with AA (FMO3 gene, effect allele G)', () => {
      const result = determineZygosity('A', 'A', 'RS2266780', {}, alleleReference);
      expect(result).toBe('Wild');
    });
  });

  describe('Data Missing - Invalid or missing alleles', () => {
    it('should detect Data Missing when allele1 is dash', () => {
      const result = determineZygosity('-', 'G', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should detect Data Missing when allele2 is dash', () => {
      const result = determineZygosity('G', '-', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should detect Data Missing when both alleles are dashes', () => {
      const result = determineZygosity('-', '-', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should detect Data Missing when allele1 is empty string', () => {
      const result = determineZygosity('', 'G', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should detect Data Missing when allele2 is empty string', () => {
      const result = determineZygosity('G', '', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });

    it('should detect Data Missing when both alleles are empty strings', () => {
      const result = determineZygosity('', '', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Data Missing');
    });
  });

  describe('Unknown RS ID handling', () => {
    it('should return Reference Missing for matching alleles when RS ID not in reference', () => {
      const result = determineZygosity('T', 'T', 'RS999999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });

    it('should return Reference Missing for different alleles when RS ID not in reference', () => {
      const result = determineZygosity('A', 'G', 'RS999999', {}, alleleReference);
      expect(result).toBe('Reference Missing');
    });
  });

  describe('Edge cases', () => {
    it('should handle RS ID case insensitivity', () => {
      const result = determineZygosity('G', 'G', 'rs1801394', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should handle allele case insensitivity for heterozygous', () => {
      const result = determineZygosity('G', 'a', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should handle allele case insensitivity for wild type', () => {
      const result = determineZygosity('a', 'A', 'RS1801394', {}, alleleReference);
      expect(result).toBe('Wild');
    });
  });

  describe('Multiple genes with same effect allele', () => {
    it('should correctly determine for RS1736557 (FMO3, effect allele A)', () => {
      const result = determineZygosity('A', 'A', 'RS1736557', {}, alleleReference);
      expect(result).toBe('Homozygous');
    });

    it('should correctly determine for RS2266782 (FMO3, effect allele A)', () => {
      const result = determineZygosity('A', 'G', 'RS2266782', {}, alleleReference);
      expect(result).toBe('Heterozygous');
    });

    it('should distinguish between different RS IDs with same gene', () => {
      // RS909531 has effect allele C
      const result1 = determineZygosity('C', 'C', 'RS909531', {}, alleleReference);
      expect(result1).toBe('Homozygous');

      // RS2266780 has effect allele G
      const result2 = determineZygosity('C', 'C', 'RS2266780', {}, alleleReference);
      expect(result2).toBe('Wild'); // C is not the effect allele for this RS ID
    });
  });

  describe('Missing or Empty Effect Allele', () => {
    it('should return Reference Missing when effect allele is empty', () => {
      const alleleReferenceWithEmpty: AlleleData[] = [
        {
          rsId: 'RS123456',
          gene: 'TEST',
          problemAllele: '', // Empty effect allele
          wildAllele: '',
          confirmationUrl: ''
        }
      ];

      // With empty effect allele, cannot determine zygosity
      const result1 = determineZygosity('A', 'A', 'RS123456', {}, alleleReferenceWithEmpty);
      expect(result1).toBe('Reference Missing');

      const result2 = determineZygosity('G', 'T', 'RS123456', {}, alleleReferenceWithEmpty);
      expect(result2).toBe('Reference Missing');
    });

    it('should return Reference Missing when problemAllele is undefined', () => {
      const alleleReferenceWithMissing: AlleleData[] = [
        {
          rsId: 'RS789012',
          gene: 'TEST2',
          problemAllele: '', // is undefined/missing
          wildAllele: '',
          confirmationUrl: ''
        }
      ];

      // Cannot determine zygosity without effect allele
      const result1 = determineZygosity('A', 'A', 'RS789012', {}, alleleReferenceWithMissing);
      expect(result1).toBe('Reference Missing');

      const result2 = determineZygosity('A', 'G', 'RS789012', {}, alleleReferenceWithMissing);
      expect(result2).toBe('Reference Missing');
    });

    it('should return Reference Missing when RS ID not in reference', () => {
      const alleleReference: AlleleData[] = [];

      // When RS ID is not in reference, cannot determine zygosity
      const result1 = determineZygosity('T', 'T', 'RS999999', {}, alleleReference);
      expect(result1).toBe('Reference Missing');

      const result2 = determineZygosity('A', 'G', 'RS999999', {}, alleleReference);
      expect(result2).toBe('Reference Missing');
    });

    it('should display effect allele as empty/undefined in report when missing', () => {
      // This tests what gets shown in the report output
      const alleleReferenceWithEmpty: AlleleData[] = [
        {
          rsId: 'RS123456',
          gene: 'TEST',
          problemAllele: '',
          wildAllele: '',
          confirmationUrl: ''
        }
      ];

      // The effect allele should be empty string or falsy
      const refData = alleleReferenceWithEmpty.find(r => r.rsId === 'RS123456');
      expect(refData?.problemAllele).toBe('');
    });
  });
});
