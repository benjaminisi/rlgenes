export interface AlleleData {
  rsId: string;
  wildAllele: string;
  problemAllele: string;
  confirmationUrl: string;
  gene?: string; // Gene associated with this RS ID
}

export interface CompendiumGeneItem {
  Gene: string;
  "RS ID": string;
  "Effect Allele": string;
}

export interface CompendiumTopic {
  Topic: string;
  ArticleName: string;
  ArticleLink: string;
  genes: CompendiumGeneItem[];
}

export type GeneToRSIDMap = Map<string, string[]>;


export interface GeneticData {
  [rsId: string]: {
    allele1: string;
    allele2: string;
  };
}

export interface GeneticDataInfo {
  data: GeneticData;
  date?: string; // Date from the first line of the file
}

export interface FileFormatInfo {
  rsIdColumn: number;
  allele1Column: number;
  allele2Column?: number; // Optional for formats where alleles are combined
  delimiter: string | RegExp;
  skipLines: number;
}

export type Zygosity = 'Homozygous' | 'Heterozygous' | 'Wild' | 'Data Missing' | 'Reference Missing';

export interface SNPResult {
  rsId: string;
  zygosity: Zygosity;
  alleles: string;
  effectAllele?: string; // The effect allele for this RS ID
  gene?: string; // The gene associated with this RS ID
}

export interface SectionSummary {
  sectionName: string;
  heterozygousCount: number;
  homozygousCount: number;
  wildCount: number;
  missingCount: number;
  referenceMissingCount: number;
  totalCount: number;
  heterozygousPercent: number;
  homozygousPercent: number;
  wildPercent: number;
  missingPercent: number;
  referenceMissingPercent: number;
}
