import type { GeneticData, FileFormatInfo } from '../types';
import { detectFileFormat } from './formatDetector';

/**
 * Parses a genetic data file and returns a map of RS IDs to alleles
 */
export async function parseGeneticDataFile(file: File): Promise<GeneticData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Get first 30 lines for format detection (increased from 20)
        const lines = content.split('\n').slice(0, 30);
        const previewContent = lines.join('\n');

        const format = detectFileFormat(previewContent);

        if (!format) {
          reject(new Error('Unable to determine file format. Please ensure your file is from 23andMe, Ancestry.com, or SelfDecode.'));
          return;
        }

        const geneticData = parseWithFormat(content, format);
        resolve(geneticData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseWithFormat(content: string, format: FileFormatInfo): GeneticData {
  const geneticData: GeneticData = {};
  const lines = content.split('\n');

  for (let i = format.skipLines; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    const parts = line.split(format.delimiter).map(p => p.trim());

    if (parts.length <= format.rsIdColumn || parts.length <= format.allele1Column) {
      continue;
    }

    const rsId = parts[format.rsIdColumn].toUpperCase();

    // Validate RS ID format
    if (!/^RS\d+$/i.test(rsId)) {
      continue;
    }

    let allele1: string;
    let allele2: string;

    if (format.allele2Column !== undefined) {
      // Separate allele columns (Ancestry format)
      allele1 = parts[format.allele1Column].toUpperCase();
      allele2 = parts[format.allele2Column].toUpperCase();
    } else {
      // Combined genotype column (23andMe, SelfDecode format)
      const genotype = parts[format.allele1Column].toUpperCase();

      if (genotype.length === 2) {
        allele1 = genotype[0];
        allele2 = genotype[1];
      } else if (genotype.length === 1) {
        // Homozygous single letter
        allele1 = genotype;
        allele2 = genotype;
      } else if (genotype === '--' || genotype === '') {
        // Missing data
        allele1 = '-';
        allele2 = '-';
      } else {
        continue; // Invalid genotype format
      }
    }

    // Store the alleles
    geneticData[rsId] = { allele1, allele2 };
  }

  return geneticData;
}

/**
 * Parses genetic data from a text string (for testing)
 */
export function parseGeneticDataString(content: string): GeneticData {
  const lines = content.split('\n').slice(0, 20);
  const previewContent = lines.join('\n');

  const format = detectFileFormat(previewContent);

  if (!format) {
    throw new Error('Unable to determine file format');
  }

  return parseWithFormat(content, format);
}
