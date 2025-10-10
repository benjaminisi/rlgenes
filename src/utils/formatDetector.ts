import type { FileFormatInfo } from '../types';

/**
 * Detects the format of a genetic data file by analyzing the first 20 lines
 * @param fileContent - First 20 lines of the file
 * @returns FileFormatInfo object or null if format cannot be determined
 */
export function detectFileFormat(fileContent: string): FileFormatInfo | null {
  const lines = fileContent.split('\n').slice(0, 30); // Increased to 30 lines to handle more comments

  // Find the first non-comment line (data or header)
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#') && line.length > 0) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    return null; // No header found
  }

  const headerLine = lines[headerLineIndex].trim();

  // Determine delimiter
  let delimiter = '\t';
  if (headerLine.includes(',') && !headerLine.includes('\t')) {
    delimiter = ',';
  }

  const headerParts = headerLine.split(delimiter).map(p => p.trim().toLowerCase());

  // Look for rsid column
  const rsIdColumnIndex = headerParts.findIndex(h =>
    h === 'rsid' || h === 'rs id' || h === 'snp' || h === '#rsid'
  );

  if (rsIdColumnIndex === -1) {
    return null; // Cannot find RS ID column
  }

  // Detect format type based on column headers
  const genotypeIndex = headerParts.findIndex(h =>
    h === 'genotype' || h === 'alleles'
  );

  const allele1Index = headerParts.findIndex(h =>
    h === 'allele1' || h === 'allele 1'
  );

  const allele2Index = headerParts.findIndex(h =>
    h === 'allele2' || h === 'allele 2'
  );

  // Format 1: Combined genotype column (23andMe, SelfDecode)
  if (genotypeIndex !== -1) {
    return {
      rsIdColumn: rsIdColumnIndex,
      allele1Column: genotypeIndex,
      delimiter,
      skipLines: headerLineIndex + 1
    };
  }

  // Format 2: Separate allele columns (Ancestry)
  if (allele1Index !== -1 && allele2Index !== -1) {
    return {
      rsIdColumn: rsIdColumnIndex,
      allele1Column: allele1Index,
      allele2Column: allele2Index,
      delimiter,
      skipLines: headerLineIndex + 1
    };
  }

  // Try to detect from data line if header is not clear
  const dataLineIndex = headerLineIndex + 1;
  if (dataLineIndex < lines.length) {
    const dataLine = lines[dataLineIndex].trim();
    if (dataLine && !dataLine.startsWith('#')) {
      const dataParts = dataLine.split(delimiter);

      // Check if the rsId column contains valid RS ID or internal id
      const rsIdValue = dataParts[rsIdColumnIndex]?.trim();
      if (rsIdValue && (/^rs\d+$/i.test(rsIdValue) || /^i\d+$/i.test(rsIdValue))) {
        // Assume combined genotype format
        // Usually genotype is the last column or 4th column
        const genotypeCol = dataParts.length > 3 ? 3 : dataParts.length - 1;

        return {
          rsIdColumn: rsIdColumnIndex,
          allele1Column: genotypeCol,
          delimiter,
          skipLines: headerLineIndex + 1
        };
      }
    }
  }

  return null; // Cannot determine format
}
