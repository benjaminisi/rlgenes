import type { GeneticData, GeneticDataInfo, FileFormatInfo } from '../types';
import { detectFileFormat } from './formatDetector';

/**
 * Extracts date from the first line of genetic data file
 */
function extractDateFromFirstLine(content: string): string | undefined {
  const firstLine = content.split('\n')[0];

  // Try to match various date formats
  // Pattern 1: "at: Day Month DD HH:MM:SS YYYY" (e.g., "at: Sun Nov  8 06:10:15 2020")
  const pattern1 = /at:\s+\w+\s+(\w+\s+\d+\s+\d+:\d+:\d+\s+\d{4})/i;
  const match1 = firstLine.match(pattern1);
  if (match1) {
    return match1[1];
  }

  // Pattern 2: ISO date format
  const pattern2 = /(\d{4}-\d{2}-\d{2})/;
  const match2 = firstLine.match(pattern2);
  if (match2) {
    return match2[1];
  }

  // Pattern 3: Month/Day/Year format
  const pattern3 = /(\d{1,2}\/\d{1,2}\/\d{4})/;
  const match3 = firstLine.match(pattern3);
  if (match3) {
    return match3[1];
  }

  return undefined;
}

/**
 * Parses a genetic data file and returns a map of RS IDs to alleles
 */
export async function parseGeneticDataFile(file: File): Promise<GeneticDataInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Extract date from first line
        const date = extractDateFromFirstLine(content);

        // Get first 30 lines for format detection (increased from 20)
        const lines = content.split('\n').slice(0, 30);
        const previewContent = lines.join('\n');

        const format = detectFileFormat(previewContent);

        if (!format) {
          reject(new Error('Unable to determine file format. Please ensure your file is from 23andMe, Ancestry.com, or SelfDecode.'));
          return;
        }

        const geneticData = parseWithFormat(content, format);
        resolve({ data: geneticData, date });
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
      const rawAllele1 = parts[format.allele1Column];
      const rawAllele2 = parts[format.allele2Column];

      // Check if alleles exist before calling toUpperCase
      if (!rawAllele1 || !rawAllele2) {
        continue; // Skip this line if alleles are missing
      }

      allele1 = rawAllele1.toUpperCase();
      allele2 = rawAllele2.toUpperCase();

      // Convert 0 or - to missing data marker
      if (allele1 === '0' || allele1 === '-') allele1 = '-';
      if (allele2 === '0' || allele2 === '-') allele2 = '-';
    } else {
      // Combined genotype column (23andMe, SelfDecode format)
      const rawGenotype = parts[format.allele1Column];

      // Check if genotype exists before calling toUpperCase
      if (!rawGenotype) {
        continue; // Skip this line if genotype is missing
      }

      const genotype = rawGenotype.toUpperCase();

      if (genotype.length === 2) {
        allele1 = genotype[0];
        allele2 = genotype[1];
      } else if (genotype.length === 1) {
        // Homozygous single letter
        allele1 = genotype;
        allele2 = genotype;
      } else if (genotype === '--' || genotype === '00' || genotype === '') {
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
export function parseGeneticDataString(content: string): GeneticDataInfo {
  // Extract date from first line
  const date = extractDateFromFirstLine(content);

  // Use more lines for format detection to handle various test cases
  const lines = content.split('\n').slice(0, 50);
  const previewContent = lines.join('\n');

  const format = detectFileFormat(previewContent);

  if (!format) {
    throw new Error('Unable to determine file format');
  }

  return { data: parseWithFormat(content, format), date };
}
