/**
 * Image Processing Utilities
 * Client-side image download, optimization, and upload
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface ProcessedImage {
  originalUrl: string;
  storageUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Download image from URL and convert to Blob
 */
export async function downloadImage(url: string): Promise<Blob> {
  try {
    // Try direct fetch first
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    // If CORS fails, try using a proxy or canvas technique
    console.warn('Direct image download failed, trying alternative method:', error);
    
    // Create an image element and draw to canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Add timestamp to bypass cache
      img.src = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    });
  }
}

/**
 * Optimize image (resize and compress)
 */
export async function optimizeImage(blob: Blob, maxWidth = 1200, maxHeight = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (optimizedBlob) => {
          if (optimizedBlob) {
            resolve(optimizedBlob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        'image/jpeg',
        0.85 // Quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = url;
  });
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(blob: Blob, filename: string): Promise<string> {
  try {
    const storageRef = ref(storage, `products/${Date.now()}_${filename}`);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Process multiple images: download, optimize, upload
 */
export async function processImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number, status: string) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  const total = imageUrls.length;
  
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    
    try {
      onProgress?.(i + 1, total, `Downloading image ${i + 1}/${total}...`);
      
      // Download
      const blob = await downloadImage(url);
      
      onProgress?.(i + 1, total, `Optimizing image ${i + 1}/${total}...`);
      
      // Optimize
      const optimized = await optimizeImage(blob);
      
      onProgress?.(i + 1, total, `Uploading image ${i + 1}/${total}...`);
      
      // Upload
      const filename = `${i}_${Date.now()}.jpg`;
      const storageUrl = await uploadImage(optimized, filename);
      
      // Get dimensions
      const dimensions = await getImageDimensions(blob);
      
      results.push({
        originalUrl: url,
        storageUrl,
        width: dimensions.width,
        height: dimensions.height,
        size: optimized.size,
      });
      
      onProgress?.(i + 1, total, `Processed ${i + 1}/${total} images`);
    } catch (error) {
      console.error(`Failed to process image ${url}:`, error);
      // Continue with other images
    }
  }
  
  return results;
}

/**
 * Get image dimensions
 */
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to get image dimensions'));
    };
    
    img.src = url;
  });
}

/**
 * Convert File to base64 data URL for AI vision
 * Uses high quality for best extraction results
 */
export async function fileToDataUrl(file: File, maxWidth = 2048, maxHeight = 2048): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      // Resize only if extremely large (keep quality high)
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL with high quality (0.95 for best results)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read file'));
    };
    
    img.src = url;
  });
}

/**
 * Compress image file before upload (for screenshots)
 */
export async function compressImageFile(file: File, maxSizeMB = 2): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file; // Already small enough
  }
  
  const blob = await optimizeImage(file, 1920, 1920);
  return new File([blob], file.name, { type: 'image/jpeg' });
}