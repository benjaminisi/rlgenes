import React, { useState } from 'react';
import { countSNPSubsections } from '../utils/snpCounter';
import { extractRSIds } from '../utils/templateProcessor';

interface TemplateInputProps {
  onTemplateLoad: (content: string) => void;
  currentTemplate?: string;
}

export const TemplateInput: React.FC<TemplateInputProps> = ({
  onTemplateLoad,
  currentTemplate
}) => {
  const [snpSubsectionCount, setSnpSubsectionCount] = useState<number>(0);
  const [totalSnpCount, setTotalSnpCount] = useState<number>(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const subsectionCount = countSNPSubsections(content);
        const rsIds = extractRSIds(content);
        setSnpSubsectionCount(subsectionCount);
        setTotalSnpCount(rsIds.length);
        onTemplateLoad(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="template-input">
      <div className="file-input-section">
        <input
          type="file"
          accept=".html,.htm"
          onChange={handleFileUpload}
          id="template-file-input"
        />
        <label htmlFor="template-file-input" className="file-input-label">
          Choose HTML File
        </label>

        <div className="instructions">
          <h4>📝 How to get the HTML file from Google Docs:</h4>
          <ol>
            <li>Open your template document in Google Docs</li>
            <li>Click <strong>File</strong> → <strong>Download</strong> → <strong>Web Page (.html, zipped)</strong></li>
            <li>Unzip the downloaded file</li>
            <li>Upload the <code>.html</code> file here</li>
          </ol>
        </div>
      </div>

      {currentTemplate && totalSnpCount > 0 && (
        <div className="template-status">
          ✓ Template loaded: <strong>{totalSnpCount} total SNPs</strong> in <strong>{snpSubsectionCount} SNP subsection{snpSubsectionCount !== 1 ? 's' : ''}</strong>
        </div>
      )}
    </div>
  );
};
