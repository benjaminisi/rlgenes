import React, { useRef, useEffect } from 'react';

interface ReportOutputProps {
  transformedHtml: string;
  onDownload: () => void;
  onCopy: () => void;
}

export const ReportOutput: React.FC<ReportOutputProps> = ({
  transformedHtml,
  onDownload,
  onCopy
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && transformedHtml) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                margin: 20px;
                font-family: Arial, sans-serif;
                line-height: 1.6;
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
            </style>
            <script>
              // Handle clicks on Return to Grand Summary links
              document.addEventListener('DOMContentLoaded', function() {
                document.addEventListener('click', function(e) {
                  var target = e.target;
                  if (target && target.tagName === 'A' && target.getAttribute('href') === '#grand-summary') {
                    e.preventDefault();
                    // Scroll parent window to grand summary
                    window.parent.document.getElementById('grand-summary').scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                });
              });
            </script>
          </head>
          <body>
            ${transformedHtml}
          </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  }, [transformedHtml]);

  return (
    <div className="report-output">
      <div className="report-actions">
        <button onClick={onCopy} className="btn-copy">
          📋 Copy to Clipboard
        </button>
        <button onClick={onDownload} className="btn-download">
          💾 Download HTML
        </button>
      </div>

      <div className="report-content-iframe">
        <iframe
          ref={iframeRef}
          title="Report Preview"
          className="report-iframe"
        />
      </div>
    </div>
  );
};
