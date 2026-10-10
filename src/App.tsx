import { useState, useEffect } from 'react';
import { sl202601html } from './content/sl/sl202601html';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { TemplateInput } from './components/TemplateInput';
import { ReportOutput } from './components/ReportOutput';
import { Legend } from './components/Legend';
import { parseGeneticDataFile } from './utils/geneticDataParser';
import {
    extractRSIdsWithRiskAlleles,
    getSNPResults,
    transformTemplate,
    calculateSectionSummaries,
    insertSummaries,
    sanitizeHTML,
    generateGrandSummaryHTML,
    extractTemplateTitle,
    injectGeneRSIDs,
} from './utils/templateProcessor';
import type { GeneticData, AlleleData, CompendiumTopic, GeneToRSIDMap } from './types';
import {sl202602html} from "./content/sl/sl202602html.ts";
import {sl202604html} from "./content/sl/sl202604html.ts";
import {sl202605html} from "./content/sl/sl202605html.ts";
import {sl202606html} from "./content/sl/sl202606html.ts";
import {sj4rl202607html} from "./content/sl/sj4rl202607html.ts";
import {rl20260709html} from "./content/rl/rl20260709html.ts";
import {
  decryptTemplate,
  getStoredDecryptionKey,
  storeDecryptionKey,
  removeStoredDecryptionKey,
  parseKeyFromHash,
  cleanHashFromUrl,
} from './utils/crypto';
import { getEncryptedTemplate } from './content/encrypted';

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
  const [showDetailedAnnotations, setShowDetailedAnnotations] = useState<boolean>(true);
  const [showAllSubsections, setShowAllSubsections] = useState<boolean>(true);
  const [hasCannedTemplate, setHasCannedTemplate] = useState<boolean>(false);
  const [isPending2026, setIsPending2026] = useState<boolean>(false);
  const [geneToRSIDMap, setGeneToRSIDMap] = useState<GeneToRSIDMap>(new Map());

  // Encrypted template state
  const [encryptedDocId, setEncryptedDocId] = useState<string | null>(null);
  const [isEncryptedTemplateLocked, setIsEncryptedTemplateLocked] = useState<boolean>(false);
  const [isEncryptedDocActive, setIsEncryptedDocActive] = useState<boolean>(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');


  // Load allele reference data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sjMode2607 = params.get("sj") === "2607";
    const isLegacyMode = params.get("rl") === "2025" || sjMode2607;
    const dataUrl = isLegacyMode 
      ? `${import.meta.env.BASE_URL}genes_rs_effect_sl202607.json`
      : `${import.meta.env.BASE_URL}genes_compendium.json`;

    fetch(dataUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (isLegacyMode) {
          // Transform the data structure to match AlleleData interface
          const transformedData = data.map((item: { 'RS ID': string; 'Effect Allele': string; 'Gene': string }) => ({
            rsId: item['RS ID'],
            problemAllele: item['Effect Allele'],
            gene: item['Gene'], // Add gene information
            wildAllele: '', // Not provided in source data
            confirmationUrl: '' // Not provided in source data
          }));
          setAlleleReference(transformedData);
          setGeneToRSIDMap(new Map());
          console.log("Loaded " + transformedData.length + " reference alleles (Legacy Mode)");
        } else {
          // Parse compendium
          const transformedData: AlleleData[] = [];
          const geneMap = new Map<string, string[]>();

          data.forEach((topic: CompendiumTopic) => {
            topic.genes.forEach(geneItem => {
              transformedData.push({
                rsId: geneItem['RS ID'],
                problemAllele: geneItem['Effect Allele'],
                gene: geneItem.Gene,
                wildAllele: '',
                confirmationUrl: ''
              });

              // Add to geneMap
              const geneName = geneItem.Gene;
              const rsId = geneItem['RS ID'];

              // Add full name
              if (!geneMap.has(geneName)) geneMap.set(geneName, []);
              if (!geneMap.get(geneName)!.includes(rsId)) {
                geneMap.get(geneName)!.push(rsId);
              }

              // Add base name (first word) if different
              const baseName = geneName.split(' ')[0];
              if (baseName !== geneName) {
                if (!geneMap.has(baseName)) geneMap.set(baseName, []);
                if (!geneMap.get(baseName)!.includes(rsId)) {
                  geneMap.get(baseName)!.push(rsId);
                }
              }
            });
          });

          setAlleleReference(transformedData);
          setGeneToRSIDMap(geneMap);
          console.log(`Loaded ${transformedData.length} reference alleles and ${geneMap.size} gene mappings (Compendium Mode)`);
        }
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
      // 1. Inject RS IDs into template based on gene map
      const enrichedTemplateContent = geneToRSIDMap.size > 0 
        ? injectGeneRSIDs(templateContent, geneToRSIDMap)
        : templateContent;

      // Extract RS IDs from template
      const {rsIds, rsIdToRiskAllele: riskAlleleOverrides} = extractRSIdsWithRiskAlleles(enrichedTemplateContent);
      console.log(`Found ${rsIds.length} unique RS IDs in template`);

      // Get SNP results
      const snpResults = getSNPResults(rsIds, geneticData, riskAlleleOverrides, alleleReference);

      // Calculate summaries
      const sectionSummaries = calculateSectionSummaries(enrichedTemplateContent, snpResults);

      // Generate Grand Summary HTML with showDetailedAnnotations parameter
      const grandSummaryHTML = generateGrandSummaryHTML(sectionSummaries, showDetailedAnnotations);

      // Transform template with both showDetailedAnnotations and showAllSubsections parameters
      const transformed = transformTemplate(
        enrichedTemplateContent,
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

  // Handlers for encrypted templates
  const handleManualUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!encryptedDocId || !unlockKeyInput.trim()) return;

    const payload = getEncryptedTemplate(encryptedDocId);
    if (!payload) return;

    try {
      const decryptedHtml = await decryptTemplate(payload, unlockKeyInput.trim());
      storeDecryptionKey(encryptedDocId, unlockKeyInput.trim());
      setHasCannedTemplate(true);
      setIsPending2026(false);
      setIsEncryptedDocActive(true);
      setIsEncryptedTemplateLocked(false);
      handleTemplateLoad(decryptedHtml);
      setUnlockError('');
      setUnlockKeyInput('');
    } catch {
      setUnlockError('Invalid decryption key. Please try again.');
    }
  };

  const handleForgetKey = () => {
    if (!encryptedDocId) return;
    removeStoredDecryptionKey(encryptedDocId);
    setIsEncryptedDocActive(false);
    setIsEncryptedTemplateLocked(true);
    setTemplateContent('');
    setTransformedHtml('');
    setHasCannedTemplate(false);
  };

  useEffect(() => {
    // This parses the full URL string directly, ignoring how React handles the search object
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams;

    // 1. Check for encrypted template:
    // Supported formats:
    //   - Explicit query param: ?template=<id> or ?doc=<id>
    //   - Direct param: ?<id> (where id matches a registered encrypted template)
    const explicitEncryptedId = params.get('template') || params.get('doc');
    let matchingEncryptedId = explicitEncryptedId;

    if (!matchingEncryptedId) {
      for (const [key] of params.entries()) {
        if (getEncryptedTemplate(key)) {
          matchingEncryptedId = key;
          break;
        }
      }
    }

    if (matchingEncryptedId) {
      const payload = getEncryptedTemplate(matchingEncryptedId);
      if (payload) {
        setEncryptedDocId(matchingEncryptedId);
        setIsPending2026(false);

        // Check URL fragment for key
        const hashKey = parseKeyFromHash(window.location.hash);
        let activeKey = hashKey;

        if (hashKey) {
          // Store key in localStorage for that document
          storeDecryptionKey(matchingEncryptedId, hashKey);
          // Clean hash from URL bar immediately so key is not exposed or stored in browser history
          cleanHashFromUrl();
        } else {
          // Look up previously saved key from localStorage
          activeKey = getStoredDecryptionKey(matchingEncryptedId);
        }

        if (activeKey) {
          decryptTemplate(payload, activeKey)
            .then((decryptedHtml) => {
              setHasCannedTemplate(true);
              setIsEncryptedDocActive(true);
              setIsEncryptedTemplateLocked(false);
              handleTemplateLoad(decryptedHtml);
              setUnlockError('');
            })
            .catch(() => {
              setIsEncryptedTemplateLocked(true);
              setUnlockError('Decryption failed. The provided key is invalid or corrupted.');
            });
        } else {
          // No key in fragment and no key in localStorage -> prompt user to enter key
          setIsEncryptedTemplateLocked(true);
        }
        return;
      }
    }

    // 2. Fall back to existing canned templates
    if (params.has("rl20260709")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(rl20260709html);
    } else if (params.has("sl202601")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sl202601html);
    } else if (params.has("sl202602")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sl202602html);
    } else if (params.has("sl202604")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sl202604html);
    } else if (params.has("sl202605")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sl202605html);
    } else if (params.has("sl202606")) {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sl202606html);
    } else if (params.get("rl") === "2025") {
        setHasCannedTemplate(false);
        setIsPending2026(false);
    } else if (params.get("sj") === "2607") {
        setHasCannedTemplate(true);
        setIsPending2026(false);
        handleTemplateLoad(sj4rl202607html);
    } else {
        setHasCannedTemplate(false);
        setIsPending2026(true);
    }
  }, []);

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
          {isEncryptedDocActive && (
            <div className="encrypted-status-banner">
              <span>
                🔒 <strong>Protected Template Active:</strong> {templateTitle || encryptedDocId} (Decryption key saved locally in this browser)
              </span>
              <button onClick={handleForgetKey} className="btn-forget-key" title="Remove saved key from this browser">
                Forget Key
              </button>
            </div>
          )}

          {isEncryptedTemplateLocked ? (
            <div className="control-panel encrypted-panel">
              <h2>🔒 Step 1: Protected Template ({getEncryptedTemplate(encryptedDocId || '')?.title || encryptedDocId})</h2>
              <p>This report template is encrypted. Enter your decryption key below to unlock it:</p>
              <form onSubmit={handleManualUnlock} className="unlock-form">
                <input
                  type="password"
                  value={unlockKeyInput}
                  onChange={(e) => setUnlockKeyInput(e.target.value)}
                  placeholder="Enter decryption key"
                  className="unlock-input"
                  autoFocus
                />
                <button type="submit" className="btn-unlock">
                  🔓 Unlock Template
                </button>
              </form>
              {unlockError && (
                <div className="error-message" style={{ marginTop: '12px' }}>
                  ⚠️ {unlockError}
                </div>
              )}
            </div>
          ) : hasCannedTemplate ? (
            <div></div>
          ) : (
            <div className="control-panel">
              <h2>Step 1: Upload Template</h2>
              <TemplateInput
                onTemplateLoad={handleTemplateLoad}
                currentTemplate={templateContent}
              />
            </div>
          )}

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
                  {isEncryptedTemplateLocked ? (
                    <p>🔒 Please enter the decryption key in Step 1 to unlock the protected template.</p>
                  ) : isPending2026 ? (
                    <p>⚠️ Default 2026 template is pending. Please use <a href="?rl=2025" style={{ color: '#2563eb', textDecoration: 'underline' }}>?rl=2025</a> to upload a 2025 format template, or wait for the 2026 template configuration.</p>
                  ) : (
                    <>
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
                    </>
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
