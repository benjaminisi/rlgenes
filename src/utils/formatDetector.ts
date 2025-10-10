import type { FileFormatInfo } from '../types';

/**
 * Detects the format of a genetic data file by analyzing the first 20 lines
 * @param fileContent - First 20 lines of the file
 * @returns FileFormatInfo object or null if format cannot be determined
 */
export function detectFileFormat(fileContent: string): FileFormatInfo | null {
  const lines = fileContent.split('\n').slice(0, 30); // Increased to 30 lines to handle more comments

  // Find the header line - either a line starting with "# rsid" or first non-comment line
  let headerLineIndex = -1;
  let isCommentHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a comment line that contains column headers
    if (line.startsWith('#') && (line.includes('rsid') || line.includes('chromosome'))) {
      const headerCheck = line.substring(1).trim().toLowerCase();
      if (headerCheck.startsWith('rsid') || headerCheck.includes('\trsid') || headerCheck.includes(',rsid')) {
        headerLineIndex = i;
        isCommentHeader = true;
        break;
      }
    }

    // Otherwise look for first non-comment line
    if (!line.startsWith('#') && line.length > 0 && headerLineIndex === -1) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    return null; // No header found
  }

  let headerLine = lines[headerLineIndex].trim();

  // Remove leading # if this is a comment header
  if (isCommentHeader && headerLine.startsWith('#')) {
    headerLine = headerLine.substring(1).trim();
  }

  // Determine delimiter
  let delimiter = '\t';
  if (headerLine.includes(',') && !headerLine.includes('\t')) {
    delimiter = ',';
  }

  const headerParts = headerLine.split(delimiter).map(p => p.trim().toLowerCase());

  // Look for rsid column
  const rsIdColumnIndex = headerParts.findIndex(h =>
    h === 'rsid' || h === 'rs id' || h === 'snp'
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
