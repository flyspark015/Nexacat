import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a product image to Firebase Storage
 * @param productId - The product ID
 * @param file - The image file to upload
 * @param onProgress - Progress callback (0-100)
 * @returns Download URL of uploaded image
 */
export const uploadProductImage = (
  productId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Delete a product image from Firebase Storage
 * @param imageUrl - The download URL of the image
 */
export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

/**
 * Upload logo to Firebase Storage
 */
export const uploadLogo = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}-${file.name}`;
    const storageRef = ref(storage, `settings/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: "Image must be less than 5MB" };
  }

  return { valid: true };
};
