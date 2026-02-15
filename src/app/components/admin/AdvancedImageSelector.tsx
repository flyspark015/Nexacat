import { useState } from 'react';
import { Check, X, Download, ExternalLink, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { ImageGroup } from '../../lib/headlessBrowser';
import { Button } from '../ui/button';

interface AdvancedImageSelectorProps {
  images: ImageGroup[];
  pagePreviewHtml?: string;
  pageUrl?: string;
  onConfirm: (selectedGroup: ImageGroup) => void;
  onCancel: () => void;
}

export function AdvancedImageSelector({
  images,
  pagePreviewHtml,
  pageUrl,
  onConfirm,
  onCancel,
}: AdvancedImageSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showPagePreview, setShowPagePreview] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onConfirm(images[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Product Image</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose the best product image from {images.length} detected image groups
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pagePreviewHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPagePreview(true)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Page
              </Button>
            )}
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((group, index) => (
              <div
                key={group.baseIdentity}
                onClick={() => setSelectedIndex(index)}
                className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                  selectedIndex === index
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Selection Indicator */}
                {selectedIndex === index && (
                  <div className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                  <img
                    src={group.thumbnailUrl}
                    alt={`Product option ${index + 1}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Preview%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  
                  {/* Zoom Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomedImage(group.bestResolutionUrl);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {/* Confidence Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    group.confidence === 'HIGH' ? 'bg-green-500 text-white' :
                    group.confidence === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {group.confidence}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">Resolution</span>
                    <span className="text-gray-600">
                      {group.estimatedResolution.width} × {group.estimatedResolution.height}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">Variants</span>
                    <span className="text-gray-600">{group.variants.length}</span>
                  </div>

                  {/* Best URL Preview */}
                  <div className="text-xs text-gray-500 truncate" title={group.bestResolutionUrl}>
                    {new URL(group.bestResolutionUrl).pathname.split('/').pop()}
                  </div>

                  {/* Download Best Quality */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(group.bestResolutionUrl, '_blank');
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    View Full Size
                  </button>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">No images detected</p>
              <p className="text-sm">Try a different product page or upload images manually</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedIndex !== null ? (
              <>
                Selected: <span className="font-medium text-gray-900">
                  {images[selectedIndex].estimatedResolution.width} × {images[selectedIndex].estimatedResolution.height}
                </span>
                {' '}({images[selectedIndex].variants.length} variants available)
              </>
            ) : (
              'Please select an image to continue'
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIndex === null}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>

      {/* Page Preview Modal */}
      {showPagePreview && pagePreviewHtml && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Product Page Preview</h3>
              <button
                onClick={() => setShowPagePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              srcDoc={pagePreviewHtml}
              className="flex-1 w-full border-0"
              sandbox="allow-same-origin"
              title="Page Preview"
            />
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
