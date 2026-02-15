import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

export interface ImageCandidate {
  url: string;
  source: 'scraped' | 'extracted' | 'uploaded';
  index: number;
}

interface ImageSelectorProps {
  images: ImageCandidate[];
  onConfirm: (selectedUrls: string[]) => void;
  onCancel: () => void;
}

export function ImageSelector({ images, onConfirm, onCancel }: ImageSelectorProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(images.map((_, i) => i)) // Select all by default
  );

  const toggleImage = (index: number) => {
    setSelectedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(images.map((_, i) => i)));
  };

  const clearAll = () => {
    setSelectedIndices(new Set());
  };

  const handleConfirm = () => {
    const selectedUrls = images
      .filter((_, i) => selectedIndices.has(i))
      .map(img => img.url);
    onConfirm(selectedUrls);
  };

  const getSourceBadge = (source: ImageCandidate['source']) => {
    const badges = {
      scraped: { label: 'Web', color: 'bg-blue-500/10 text-blue-600' },
      extracted: { label: 'AI', color: 'bg-purple-500/10 text-purple-600' },
      uploaded: { label: 'Upload', color: 'bg-green-500/10 text-green-600' },
    };
    const badge = badges[source];
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-muted rounded-2xl p-6 border-2 border-border"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">
          📸 Select Product Images
        </h3>
        <p className="text-sm text-muted-foreground">
          Found {images.length} candidate images. Select which ones to include in the product listing.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
          disabled={selectedIndices.size === images.length}
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          disabled={selectedIndices.size === 0}
        >
          Clear
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {selectedIndices.size} of {images.length} selected
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4 max-h-[500px] overflow-y-auto">
        {images.map((image, index) => {
          const isSelected = selectedIndices.has(index);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-blue-accent shadow-lg scale-[1.02]'
                  : 'border-transparent hover:border-border'
              }`}
              onClick={() => toggleImage(index)}
            >
              {/* Image */}
              <div className="aspect-square bg-background">
                <img
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Source Badge */}
              <div className="absolute top-2 left-2">
                {getSourceBadge(image.source)}
              </div>

              {/* Selection Indicator */}
              <div
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-accent text-white scale-100'
                    : 'bg-background/80 text-muted-foreground scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                }`}
              >
                {isSelected ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border-2 border-current rounded-full" />
                )}
              </div>

              {/* Hover Overlay */}
              {!isSelected && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm/Cancel Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleConfirm}
          disabled={selectedIndices.size === 0}
          className="flex-1 bg-blue-accent hover:bg-blue-accent/90"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Selection ({selectedIndices.size})
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
