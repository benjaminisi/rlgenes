import React, { useState } from 'react';

interface TemplateInputProps {
  onTemplateLoad: (content: string) => void;
  currentTemplate?: string;
}

export const TemplateInput: React.FC<TemplateInputProps> = ({
  onTemplateLoad,
  currentTemplate
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'text' | 'url'>('file');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onTemplateLoad(content);
      };
      reader.readAsText(file);
    }
  };

  const handleTextSubmit = () => {
    if (textContent.trim()) {
      onTemplateLoad(textContent);
    }
  };

  const handleUrlSubmit = async () => {
    if (urlContent.trim()) {
      try {
        const response = await fetch(urlContent);
        const content = await response.text();
        onTemplateLoad(content);
      } catch {
        alert('Failed to fetch content from URL. Make sure the URL is accessible and CORS is enabled.');
      }
    }
  };

  return (
    <div className="template-input">
      <h3>Template Input</h3>

      <div className="input-mode-selector">
        <button
          className={inputMode === 'file' ? 'active' : ''}
          onClick={() => setInputMode('file')}
        >
          Upload File
        </button>
        <button
          className={inputMode === 'text' ? 'active' : ''}
          onClick={() => setInputMode('text')}
        >
          Paste HTML
        </button>
        <button
          className={inputMode === 'url' ? 'active' : ''}
          onClick={() => setInputMode('url')}
        >
          Google Doc URL
        </button>
      </div>

      {inputMode === 'file' && (
        <div className="file-input-section">
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
          />
          <p className="hint">Upload the HTML file exported from Google Docs (File → Download → Web Page)</p>
        </div>
      )}

      {inputMode === 'text' && (
        <div className="text-input-section">
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste your HTML template content here..."
            rows={10}
          />
          <button onClick={handleTextSubmit}>Load Template</button>
        </div>
      )}

      {inputMode === 'url' && (
        <div className="url-input-section">
          <input
            type="text"
            value={urlContent}
            onChange={(e) => setUrlContent(e.target.value)}
            placeholder="Enter Google Doc URL..."
          />
          <button onClick={handleUrlSubmit}>Fetch Template</button>
          <p className="hint">Note: The document must be publicly accessible</p>
        </div>
      )}

      {currentTemplate && (
        <div className="template-status">
          ✓ Template loaded ({currentTemplate.length} characters)
        </div>
      )}
    </div>
  );
};
