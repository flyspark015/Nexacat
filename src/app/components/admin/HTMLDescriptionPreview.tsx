import { useState } from 'react';
import { Eye, Code, Maximize2, X } from 'lucide-react';
import { Button } from '../ui/button';

interface HTMLDescriptionPreviewProps {
  html: string;
  onHtmlChange?: (html: string) => void;
  editable?: boolean;
}

export function HTMLDescriptionPreview({
  html,
  onHtmlChange,
  editable = false,
}: HTMLDescriptionPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localHtml, setLocalHtml] = useState(html);

  const handleHtmlChange = (newHtml: string) => {
    setLocalHtml(newHtml);
    onHtmlChange?.(newHtml);
  };

  const PreviewContent = () => (
    <div className="prose prose-sm max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: localHtml }}
        className="product-description"
      />
    </div>
  );

  const CodeContent = () => (
    <div className="relative">
      {editable ? (
        <textarea
          value={localHtml}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          spellCheck={false}
        />
      ) : (
        <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm border border-gray-700">
          <code>{localHtml}</code>
        </pre>
      )}
    </div>
  );

  const content = (
    <div className={`bg-white rounded-lg border ${isFullscreen ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Product Description Preview</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {viewMode === 'preview' ? 'Live preview of HTML content' : 'HTML source code'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'code'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              Code
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <X className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`p-6 overflow-y-auto ${isFullscreen ? 'h-[calc(100%-64px)]' : 'max-h-[600px]'}`}>
        {viewMode === 'preview' ? <PreviewContent /> : <CodeContent />}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Clean HTML description from extracted product data
 * Removes junk content, ads, tracking, etc.
 */
export function cleanProductHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'iframe',
    'noscript',
    '[class*="ad"]',
    '[class*="banner"]',
    '[class*="tracking"]',
    '[class*="cookie"]',
    '[class*="newsletter"]',
    '[class*="popup"]',
    '[class*="modal"]',
    '[id*="ad"]',
    '[id*="banner"]',
    'footer',
    'nav',
    'header',
    '.social-share',
    '.related-products',
    '.recommended',
    '.upsell',
    '.cross-sell',
  ];
  
  unwantedSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Remove empty paragraphs
  doc.querySelectorAll('p').forEach(p => {
    if (!p.textContent?.trim()) {
      p.remove();
    }
  });
  
  // Clean attributes (remove inline styles, event handlers)
  doc.querySelectorAll('*').forEach(el => {
    // Keep only safe attributes
    const safeAttrs = ['href', 'src', 'alt', 'title', 'class'];
    const attrs = Array.from(el.attributes);
    
    attrs.forEach(attr => {
      if (!safeAttrs.includes(attr.name) && !attr.name.startsWith('data-')) {
        el.removeAttribute(attr.name);
      }
    });
    
    // Remove dangerous classes
    const classes = Array.from(el.classList);
    classes.forEach(cls => {
      if (cls.includes('ad') || cls.includes('tracking') || cls.includes('analytics')) {
        el.classList.remove(cls);
      }
    });
  });
  
  // Get body content
  const body = doc.body;
  
  return body.innerHTML.trim();
}

/**
 * Generate modern HTML description from product data
 */
export function generateModernHTML(data: {
  title?: string;
  description: string;
  features?: string[];
  specifications?: Record<string, string>;
  images?: string[];
}): string {
  const sections: string[] = [];
  
  // Main description
  if (data.description) {
    sections.push(`<div class="product-description-main">${data.description}</div>`);
  }
  
  // Features list
  if (data.features && data.features.length > 0) {
    sections.push(`
      <div class="product-features">
        <h3>Key Features</h3>
        <ul>
          ${data.features.map(feature => `<li>${feature}</li>`).join('\n          ')}
        </ul>
      </div>
    `);
  }
  
  // Specifications table
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    sections.push(`
      <div class="product-specifications">
        <h3>Specifications</h3>
        <table>
          <tbody>
            ${Object.entries(data.specifications)
              .map(([key, value]) => `
                <tr>
                  <th>${key}</th>
                  <td>${value}</td>
                </tr>
              `)
              .join('\n            ')}
          </tbody>
        </table>
      </div>
    `);
  }
  
  return `
    <div class="flyspark-product-content">
      ${sections.join('\n\n      ')}
    </div>
  `.trim();
}
