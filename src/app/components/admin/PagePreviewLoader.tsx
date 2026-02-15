/**
 * Page Preview Loader - Client-side iframe loading with HTML extraction
 * Loads a webpage in an iframe, waits for full rendering, and extracts final HTML
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, ExternalLink, Code, Copy, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { analyzePageForProducts, PageAnalysisResult, formatAnalysisResultAsMarkdown } from '../../lib/pageAnalyzer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface PagePreviewLoaderProps {
  url: string;
  onAnalysisComplete?: (result: PageAnalysisResult) => void;
}

export function PagePreviewLoader({ url, onAnalysisComplete }: PagePreviewLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PageAnalysisResult | null>(null);
  const [showHTML, setShowHTML] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [copiedImages, setCopiedImages] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => {
      clearInterval(progressInterval);
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const handleIframeLoad = async () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) {
        throw new Error('Failed to access iframe content');
      }

      // Wait a bit more for JavaScript to execute
      setLoadProgress(85);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoadProgress(95);

      // Analyze the page
      const result = await analyzePageForProducts(iframe.contentDocument, url);
      
      setLoadProgress(100);
      setAnalysisResult(result);
      setLoading(false);
      
      // Call callback
      onAnalysisComplete?.(result);
      
      toast.success(`Analysis complete! Found ${result.mainProductImages.length} product images`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message);
      setLoading(false);
      toast.error('Failed to analyze page');
    }
  };

  const handleIframeError = () => {
    setError('Failed to load page. The site may block iframe embedding.');
    setLoading(false);
  };

  const copyHTML = async () => {
    if (!analysisResult) return;
    
    try {
      await navigator.clipboard.writeText(analysisResult.html);
      setCopiedHTML(true);
      toast.success('HTML copied to clipboard!');
      setTimeout(() => setCopiedHTML(false), 2000);
    } catch (err) {
      toast.error('Failed to copy HTML');
    }
  };

  const copyImageURLs = async () => {
    if (!analysisResult) return;
    
    try {
      const imageData = analysisResult.mainProductImages.map((img, idx) => 
        `${idx + 1}. ${img.url} (${img.naturalWidth}×${img.naturalHeight}, Score: ${img.score})`
      ).join('\n');
      
      await navigator.clipboard.writeText(imageData);
      setCopiedImages(true);
      toast.success('Image URLs copied to clipboard!');
      setTimeout(() => setCopiedImages(false), 2000);
    } catch (err) {
      toast.error('Failed to copy image URLs');
    }
  };

  const downloadHTML = () => {
    if (!analysisResult) return;
    
    const blob = new Blob([analysisResult.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML downloaded!');
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Loading page...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Waiting for JavaScript to execute and DOM to fully render
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-blue-600 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Failed to load page
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Some websites block iframe embedding for security. Try using the URL extraction method instead.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Preview */}
      <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="text-xs text-muted-foreground ml-2 font-mono truncate max-w-md">
              {url}
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        </div>
        
        <div className="relative" style={{ height: '500px' }}>
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyHTML}
              className="gap-2"
            >
              {copiedHTML ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
              {copiedHTML ? 'Copied!' : 'Copy HTML'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={copyImageURLs}
              className="gap-2"
            >
              {copiedImages ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              {copiedImages ? 'Copied!' : 'Copy Image URLs'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadHTML}
              className="gap-2"
            >
              <Code className="w-4 h-4" />
              Download HTML
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHTML(!showHTML)}
              className="gap-2"
            >
              <Code className="w-4 h-4" />
              {showHTML ? 'Hide HTML' : 'Show HTML'}
            </Button>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Analysis Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold text-foreground">{analysisResult.stats.totalImages}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Product Images</p>
                <p className="text-2xl font-bold text-green-600">{analysisResult.stats.productImages}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">HTML Size</p>
                <p className="text-2xl font-bold text-foreground">
                  {(analysisResult.html.length / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Analysis Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {(analysisResult.stats.analysisTime / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          </div>

          {/* Main Product Images */}
          {analysisResult.mainProductImages.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Main Product Images ({analysisResult.mainProductImages.length})
              </h3>
              <div className="space-y-4">
                {analysisResult.mainProductImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-3 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={img.url}
                          alt={img.alt || `Product ${idx + 1}`}
                          className="w-24 h-24 object-cover rounded border border-border"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {img.url.split('/').pop()}
                            </p>
                            {img.alt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Alt: {img.alt}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Score: {img.score}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Resolution:</span>{' '}
                            <span className="font-medium">{img.naturalWidth} × {img.naturalHeight}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size:</span>{' '}
                            <span className="font-medium">
                              {(img.naturalWidth * img.naturalHeight / 1000000).toFixed(2)} MP
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>{' '}
                            <span className="font-medium">{img.type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Display:</span>{' '}
                            <span className="font-medium">
                              {Math.round(img.displayWidth)} × {Math.round(img.displayHeight)}
                            </span>
                          </div>
                        </div>
                        {img.reasoning.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                              Show reasoning ({img.reasoning.length} factors)
                            </summary>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {img.reasoning.map((reason, ridx) => (
                                <li key={ridx}>• {reason}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HTML Code */}
          {showHTML && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-900 rounded-lg p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Final Rendered HTML</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyHTML}
                  className="text-white hover:text-white/80"
                >
                  {copiedHTML ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-black rounded border border-gray-700 overflow-auto max-h-96">
                <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto">
                  <code>{analysisResult.html}</code>
                </pre>
              </div>
            </motion.div>
          )}

          {/* AI Agent Instructions */}
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              📋 For AI Agent Analysis
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Copy the HTML and image URLs above to provide to an AI agent for detailed product analysis.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded border border-border p-3">
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {formatAnalysisResultAsMarkdown(analysisResult)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
