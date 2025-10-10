import React from 'react';
import type { SectionSummary } from '../types';

interface ReportOutputProps {
  transformedHtml: string;
  summaries: SectionSummary[];
  onDownload: () => void;
  onCopy: () => void;
}

export const ReportOutput: React.FC<ReportOutputProps> = ({
  transformedHtml,
  summaries,
  onDownload,
  onCopy
}) => {
  // Sort summaries by homozygous percentage (highest first)
  const sortedSummaries = [...summaries].sort((a, b) => b.homozygousPercent - a.homozygousPercent);

  // Calculate grand totals
  const grandTotals = summaries.reduce(
    (acc, summary) => ({
      totalSNPs: acc.totalSNPs + summary.totalCount,
      homozygousCount: acc.homozygousCount + summary.homozygousCount,
      heterozygousCount: acc.heterozygousCount + summary.heterozygousCount,
      wildCount: acc.wildCount + summary.wildCount,
      missingCount: acc.missingCount + summary.missingCount,
    }),
    { totalSNPs: 0, homozygousCount: 0, heterozygousCount: 0, wildCount: 0, missingCount: 0 }
  );

  const snpsWithData = grandTotals.totalSNPs - grandTotals.missingCount;
  const homozygousPercent = grandTotals.totalSNPs > 0 ? (grandTotals.homozygousCount / grandTotals.totalSNPs) * 100 : 0;
  const heterozygousPercent = grandTotals.totalSNPs > 0 ? (grandTotals.heterozygousCount / grandTotals.totalSNPs) * 100 : 0;

  // Helper function to create section ID from section name
  const getSectionId = (sectionName: string) => {
    return 'section-' + sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  // Helper function to scroll to section
  const scrollToSection = (sectionName: string) => {
    const sectionId = getSectionId(sectionName);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="report-output">
      <div className="report-header">
        <h2>Generated Report</h2>
        <div className="report-actions">
          <button onClick={onCopy} className="btn-copy">
            📋 Copy to Clipboard
          </button>
          <button onClick={onDownload} className="btn-download">
            💾 Download HTML
          </button>
        </div>
      </div>

      {sortedSummaries.length > 0 && (
        <div className="grand-summary">
          <h3>Grand Summary</h3>
          <div className="summary-stats">
            <p>
              <strong>Total SNPs in template:</strong> {grandTotals.totalSNPs} |
              <strong> SNPs with data:</strong> {snpsWithData} |
              <strong style={{ color: 'red' }}> Homozygous:</strong> {grandTotals.homozygousCount} ({homozygousPercent.toFixed(1)}%) |
              <strong> Heterozygous:</strong> {grandTotals.heterozygousCount} ({heterozygousPercent.toFixed(1)}%)
            </p>
          </div>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Total SNPs</th>
                <th>Homozygous</th>
                <th>Heterozygous</th>
                <th>Wild Type</th>
                <th>Data Missing</th>
              </tr>
            </thead>
            <tbody>
              {sortedSummaries.map((summary, index) => (
                <tr key={index}>
                  <td>
                    <a
                      href={`#${getSectionId(summary.sectionName)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(summary.sectionName);
                      }}
                      style={{ cursor: 'pointer', color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      {summary.sectionName}
                    </a>
                  </td>
                  <td>{summary.totalCount}</td>
                  <td style={{ color: 'red', fontWeight: 'bold' }}>
                    {summary.homozygousCount} ({summary.homozygousPercent.toFixed(1)}%)
                  </td>
                  <td>{summary.heterozygousCount} ({summary.heterozygousPercent.toFixed(1)}%)</td>
                  <td style={{ color: 'green' }}>
                    {summary.wildCount} ({summary.wildPercent.toFixed(1)}%)
                  </td>
                  <td style={{ color: 'grey' }}>
                    {summary.missingCount} ({summary.missingPercent.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="report-content">
        <div
          dangerouslySetInnerHTML={{ __html: transformedHtml }}
        />
      </div>
    </div>
  );
};
