import { useState, useEffect } from 'react';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { TemplateInput } from './components/TemplateInput';
import { ReportOutput } from './components/ReportOutput';
import { parseGeneticDataFile } from './utils/geneticDataParser';
import {
  extractRSIds,
  getSNPResults,
  transformTemplate,
  calculateSectionSummaries,
  insertSummaries,
  sanitizeHTML,
  generateGrandSummaryHTML,
  extractTemplateTitle
} from './utils/templateProcessor';
import type { GeneticData, AlleleData, SectionSummary } from './types';

function App() {
  const [geneticDataFile, setGeneticDataFile] = useState<File | null>(null);
  const [geneticData, setGeneticData] = useState<GeneticData | null>(null);
  const [geneticDataDate, setGeneticDataDate] = useState<string | undefined>(undefined);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateTitle, setTemplateTitle] = useState<string>('Genetic Report');
  const [alleleReference, setAlleleReference] = useState<AlleleData[]>([]);
  const [transformedHtml, setTransformedHtml] = useState<string>('');
  const [summaries, setSummaries] = useState<SectionSummary[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load allele reference data on mount
  useEffect(() => {
    fetch('/allele_data.json')
      .then(res => res.json())
      .then(data => setAlleleReference(data))
      .catch(err => console.error('Failed to load allele reference data:', err));
  }, []);

  const handleGeneticFileSelect = async (file: File) => {
    setGeneticDataFile(file);
    setError('');
    // Clear previous report when new file is uploaded
    setTransformedHtml('');
    setSummaries([]);

    try {
      const result = await parseGeneticDataFile(file);
      setGeneticData(result.data);
      setGeneticDataDate(result.date);
      console.log(`Loaded ${Object.keys(result.data).length} genetic markers`);
      if (result.date) {
        console.log(`Genome dated: ${result.date}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse genetic data file';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleTemplateLoad = (content: string) => {
    setTemplateContent(content);
    setError('');
    // Clear previous report when new template is uploaded
    setTransformedHtml('');
    setSummaries([]);
    // Extract title from template
    const title = extractTemplateTitle(content);
    setTemplateTitle(title);
    console.log('Template loaded');
  };

  const handleGenerateReport = () => {
    if (!geneticData) {
      alert('Please upload a genetic data file first');
      return;
    }

    if (!templateContent) {
      alert('Please load a template first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Extract RS IDs from template
      const rsIds = extractRSIds(templateContent);
      console.log(`Found ${rsIds.length} unique RS IDs in template`);

      // Get SNP results
      const snpResults = getSNPResults(rsIds, geneticData, alleleReference);

      // Transform template (automatically filters out non-variant subsections)
      const transformed = transformTemplate(templateContent, snpResults);

      // Calculate summaries
      const sectionSummaries = calculateSectionSummaries(templateContent, snpResults);

      // Insert summaries into template
      const withSummaries = insertSummaries(transformed, sectionSummaries);

      // Sanitize HTML
      const sanitized = sanitizeHTML(withSummaries);

      setTransformedHtml(sanitized);
      setSummaries(sectionSummaries);

      console.log('Report generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    // Create a complete HTML document with Grand Summary at the top
    const grandSummaryHTML = generateGrandSummaryHTML(summaries);
    const dateInfo = geneticDataDate ? `<p><strong>Client raw genome dated:</strong> ${geneticDataDate}</p>` : '';
    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateTitle} - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3, h4 {
      color: #1f2937;
    }
    table {
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>🧬 ${templateTitle}</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  ${dateInfo}
  ${grandSummaryHTML}
  <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
  ${transformedHtml}
</body>
</html>`;

    const blob = new Blob([completeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genetic_report_${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transformedHtml)
      .then(() => alert('Report copied to clipboard!'))
      .catch(() => alert('Failed to copy to clipboard'));
  };

  // Determine if Generate button should be enabled
  const canGenerate = geneticData && Object.keys(geneticData).length > 0 && templateContent && !isProcessing;

  return (
    <div className="app">
      <header>
        <h1>🧬 Genetic Data Personalization Tool</h1>
        <p>Automate the personalization of genetic data explanation templates</p>
      </header>

      <main>
        <section className="controls">
          <div className="control-panel">
            <h2>Step 1: Upload Template</h2>
            <TemplateInput
              onTemplateLoad={handleTemplateLoad}
              currentTemplate={templateContent}
            />
          </div>

          <div className="control-panel">
            <h2>Step 2: Upload Genetic Data</h2>
            <FileUpload
              label="Select your raw genetic data file (23andMe, Ancestry, or SelfDecode)"
              accept=".txt,.csv"
              onFileSelect={handleGeneticFileSelect}
              currentFileName={geneticDataFile?.name}
            />
            {geneticData && (
              <div className="data-status">
                ✓ Loaded {Object.keys(geneticData).length} genetic markers
                {geneticDataDate && ` (dated: ${geneticDataDate})`}
              </div>
            )}
          </div>

          <div className="control-panel">
            <h2>Step 3: Generate Report</h2>
            <div className="generate-section">
              <button
                onClick={handleGenerateReport}
                disabled={!canGenerate}
                className="btn-generate"
              >
                {isProcessing ? 'Generating...' : '🧬 Generate Report'}
              </button>
              {!canGenerate && !isProcessing && (
                <div className="requirements-message">
                  {!templateContent && !geneticData && (
                    <p>📋 Please upload both a template file and a genetic data file to generate a report.</p>
                  )}
                  {!templateContent && geneticData && (
                    <p>📋 Please upload a template file to generate a report.</p>
                  )}
                  {templateContent && !geneticData && (
                    <p>🧬 Please upload a genetic data file to generate a report.</p>
                  )}
                  {templateContent && geneticData && Object.keys(geneticData).length === 0 && (
                    <p>⚠️ The uploaded genetic data file contains no valid markers. Please check your file.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </section>

        {transformedHtml && (
          <section className="output-section">
            <ReportOutput
              transformedHtml={transformedHtml}
              summaries={summaries}
              templateTitle={templateTitle}
              onDownload={handleDownload}
              onCopy={handleCopy}
            />
          </section>
        )}
      </main>

      <footer>
        <p>
          <strong>Note:</strong> This application runs entirely in your browser.
          No data is uploaded to any server.
        </p>
      </footer>
    </div>
  );
}

export default App;
