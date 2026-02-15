import { X } from 'lucide-react';

interface HTMLPreviewModalProps {
  html: string;
  url: string;
  onClose: () => void;
}

export function HTMLPreviewModal({ html, url, onClose }: HTMLPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">Fetched Page Preview</h3>
            <p className="text-sm text-gray-600 truncate">{url}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HTML Preview */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            title="Fetched Page Preview"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            HTML Size: {(html.length / 1024).toFixed(1)} KB
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
