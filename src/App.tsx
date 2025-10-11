import { useState, useEffect } from 'react';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { TemplateInput } from './components/TemplateInput';
import { ReportOutput } from './components/ReportOutput';
import { Legend } from './components/Legend';
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
import type { GeneticData, AlleleData } from './types';

function App() {
  const [geneticDataFile, setGeneticDataFile] = useState<File | null>(null);
  const [geneticData, setGeneticData] = useState<GeneticData | null>(null);
  const [geneticDataDate, setGeneticDataDate] = useState<string | undefined>(undefined);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateTitle, setTemplateTitle] = useState<string>('Genetic Report');
  const [alleleReference, setAlleleReference] = useState<AlleleData[]>([]);
  const [transformedHtml, setTransformedHtml] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showDetailedAnnotations, setShowDetailedAnnotations] = useState<boolean>(false);
  const [showAllSubsections, setShowAllSubsections] = useState<boolean>(false);

  // Load allele reference data on mount
  useEffect(() => {
    fetch('/genes_rs_effect.json')
      .then(res => res.json())
      .then(data => {
        // Transform the data structure to match AlleleData interface
        const transformedData = data.map((item: { 'RS ID': string; 'Effect Allele': string; 'Gene': string }) => ({
          rsId: item['RS ID'],
          problemAllele: item['Effect Allele'],
          gene: item['Gene'], // Add gene information
          wildAllele: '', // Not provided in source data
          confirmationUrl: '' // Not provided in source data
        }));
        setAlleleReference(transformedData);
      })
      .catch(err => console.error('Failed to load allele reference data:', err));
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('showLegend', JSON.stringify(showLegend));
    localStorage.setItem('showDetailedAnnotations', JSON.stringify(showDetailedAnnotations));
  }, [showLegend, showDetailedAnnotations]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedShowLegend = localStorage.getItem('showLegend');
    if (savedShowLegend !== null) {
      setShowLegend(JSON.parse(savedShowLegend));
    }
    const savedShowDetailedAnnotations = localStorage.getItem('showDetailedAnnotations');
    if (savedShowDetailedAnnotations !== null) {
      setShowDetailedAnnotations(JSON.parse(savedShowDetailedAnnotations));
    }
  }, []);

  // Calculate step completion
  const step1Complete = !!templateContent;
  const step2Complete = !!geneticData && Object.keys(geneticData).length > 0;
  const step3Complete = !!transformedHtml;

  const handleGeneticFileSelect = async (file: File) => {
    setGeneticDataFile(file);
    setError('');
    // Clear previous genetic data and report immediately when new file is uploaded
    setGeneticData(null);
    setGeneticDataDate(undefined);
    setTransformedHtml('');

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

      // Calculate summaries
      const sectionSummaries = calculateSectionSummaries(templateContent, snpResults);

      // Generate Grand Summary HTML with showDetailedAnnotations parameter
      const grandSummaryHTML = generateGrandSummaryHTML(sectionSummaries, showDetailedAnnotations);

      // Transform template with both showDetailedAnnotations and showAllSubsections parameters
      const transformed = transformTemplate(
        templateContent,
        snpResults,
        geneticDataFile?.name,
        geneticDataDate,
        grandSummaryHTML,
        showDetailedAnnotations,
        showAllSubsections
      );

      // Insert summaries into template
      const withSummaries = insertSummaries(transformed, sectionSummaries);

      // Sanitize HTML
      const sanitized = sanitizeHTML(withSummaries);

      setTransformedHtml(sanitized);

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
    // Create a complete HTML document - Grand Summary is now embedded in transformedHtml
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
    /* Preserve original template styling */
    li {
      margin-bottom: 15px;
    }
    strong {
      font-weight: bold;
    }
    /* Ensure bolded text stays bold */
    b, strong, .bold {
      font-weight: bold !important;
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

      {/* Progress Tracker */}
      <div className="progress-tracker">
        <div className={`progress-step ${step1Complete ? 'complete' : ''}`}>
          <div className="step-circle">
            {step1Complete ? '✓' : '1'}
          </div>
          <div className="step-label">Upload Template</div>
        </div>
        <div className={`progress-line ${step1Complete ? 'complete' : ''}`}></div>
        <div className={`progress-step ${step2Complete ? 'complete' : ''}`}>
          <div className="step-circle">
            {step2Complete ? '✓' : '2'}
          </div>
          <div className="step-label">Upload Data</div>
        </div>
        <div className={`progress-line ${step2Complete ? 'complete' : ''}`}></div>
        <div className={`progress-step ${step3Complete ? 'complete' : ''}`}>
          <div className="step-circle">
            {step3Complete ? '✓' : '3'}
          </div>
          <div className="step-label">Generate Report</div>
        </div>
      </div>

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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showDetailedAnnotations}
                    onChange={(e) => setShowDetailedAnnotations(e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span>Show detailed annotations (alleles, effect allele, gene)</span>
                </label>
                <p style={{ marginLeft: '28px', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                  When enabled, Homozygous and Heterozygous annotations will include the allele pair, effect allele, and associated gene.
                </p>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAllSubsections}
                    onChange={(e) => setShowAllSubsections(e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span>Show all subsections (including non-variant)</span>
                </label>
                <p style={{ marginLeft: '28px', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                  When enabled, the report will include all subsections from the template, not just those with genetic variants.
                </p>
              </div>
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
              onDownload={handleDownload}
              onCopy={handleCopy}
            />
          </section>
        )}
      </main>

      {/* Legend Component */}
      {transformedHtml && (
        <Legend isVisible={showLegend} onToggle={() => setShowLegend(!showLegend)} />
      )}

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
