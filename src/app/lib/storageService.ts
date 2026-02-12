import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Validate image file type and size
 * @param file - The file to validate
 * @returns Validation result with valid flag and optional error message
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, or SVG).',
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
};

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'logos/company-logo.png')
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

/**
 * Upload an image file with validation
 * @param file - The image file to upload
 * @param folder - The folder name (e.g., 'logos', 'products', 'categories')
 * @returns The download URL of the uploaded image
 */
export const uploadImage = async (file: File, folder: string): Promise<string> => {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `${folder}/${fileName}`;

  return uploadFile(file, path);
};

/**
 * Delete a file from Firebase Storage
 * @param url - The download URL of the file to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error - file might already be deleted or not exist
  }
};

/**
 * Upload logo with optimized settings
 * @param file - The logo file to upload
 * @returns The download URL of the uploaded logo
 */
export const uploadLogo = async (file: File): Promise<string> => {
  return uploadImage(file, 'logos');
};

/**
 * Upload favicon with optimized settings
 * @param file - The favicon file to upload
 * @returns The download URL of the uploaded favicon
 */
export const uploadFavicon = async (file: File): Promise<string> => {
  return uploadImage(file, 'favicons');
};

/**
 * Upload product image
 * @param file - The product image file to upload
 * @returns The download URL of the uploaded product image
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  return uploadImage(file, 'products');
};

/**
 * Upload category image
 * @param file - The category image file to upload
 * @returns The download URL of the uploaded category image
 */
export const uploadCategoryImage = async (file: File): Promise<string> => {
  return uploadImage(file, 'categories');
};

/**
 * Upload payment QR code
 * @param file - The QR code image file to upload
 * @returns The download URL of the uploaded QR code
 */
export const uploadPaymentQR = async (file: File): Promise<string> => {
  return uploadImage(file, 'payment');
};