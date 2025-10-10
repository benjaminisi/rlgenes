export interface AlleleData {
  rsId: string;
  wildAllele: string;
  problemAllele: string;
  confirmationUrl: string;
}

export interface GeneticData {
  [rsId: string]: {
    allele1: string;
    allele2: string;
  };
}

export interface FileFormatInfo {
  rsIdColumn: number;
  allele1Column: number;
  allele2Column?: number; // Optional for formats where alleles are combined
  delimiter: string;
  skipLines: number;
}

export type Zygosity = 'Homozygous' | 'Heterozygous' | 'Wild' | 'Data Missing';

export interface SNPResult {
  rsId: string;
  zygosity: Zygosity;
  alleles: string;
}

export interface SectionSummary {
  sectionName: string;
  heterozygousCount: number;
  homozygousCount: number;
  wildCount: number;
  missingCount: number;
  totalCount: number;
  heterozygousPercent: number;
  homozygousPercent: number;
  wildPercent: number;
  missingPercent: number;
}
