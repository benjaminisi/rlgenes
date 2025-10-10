import { useState, useEffect } from 'react';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { TemplateInput } from './components/TemplateInput';
import { AlleleReferenceTable } from './components/AlleleReferenceTable';
import { ReportOutput } from './components/ReportOutput';
import { parseGeneticDataFile } from './utils/geneticDataParser';
import {
  extractRSIds,
  getSNPResults,
  transformTemplate,
  calculateSectionSummaries,
  insertSummaries,
  sanitizeHTML
} from './utils/templateProcessor';
import type { GeneticData, AlleleData, SectionSummary } from './types';

function App() {
  const [geneticDataFile, setGeneticDataFile] = useState<File | null>(null);
  const [geneticData, setGeneticData] = useState<GeneticData | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [alleleReference, setAlleleReference] = useState<AlleleData[]>([]);
  const [transformedHtml, setTransformedHtml] = useState<string>('');
  const [summaries, setSummaries] = useState<SectionSummary[]>([]);
  const [hideWild, setHideWild] = useState<boolean>(false);
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

    try {
      const data = await parseGeneticDataFile(file);
      setGeneticData(data);
      console.log(`Loaded ${Object.keys(data).length} genetic markers`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse genetic data file';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleTemplateLoad = (content: string) => {
    setTemplateContent(content);
    setError('');
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

      // Transform template
      const transformed = transformTemplate(templateContent, snpResults, hideWild);

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
    const blob = new Blob([transformedHtml], { type: 'text/html' });
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
              </div>
            )}
          </div>

          <div className="control-panel">
            <h2>Step 3: Generate Report</h2>
            <div className="generate-section">
              <div className="toggle-option">
                <label>
                  <input
                    type="checkbox"
                    checked={hideWild}
                    onChange={(e) => setHideWild(e.target.checked)}
                  />
                  Hide Wild Type SNP subsections
                </label>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={!geneticData || !templateContent || isProcessing}
                className="btn-generate"
              >
                {isProcessing ? 'Generating...' : '🧬 Generate Report'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </section>

        <section className="reference-section">
          <AlleleReferenceTable
            alleleData={alleleReference}
            onUpdate={setAlleleReference}
          />
        </section>

        {transformedHtml && (
          <section className="output-section">
            <ReportOutput
              transformedHtml={transformedHtml}
              summaries={summaries}
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
