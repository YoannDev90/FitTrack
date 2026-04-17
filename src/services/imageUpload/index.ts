// ============================================================================
// IMAGE UPLOAD SERVICE - Upload temporaire d'images
// Utilise tmpfiles.org (fichiers supprimés après 1 heure max)
// Utilise la nouvelle API File de expo-file-system (SDK 54+)
// ============================================================================

import { File, Paths } from 'expo-file-system';
import { fetchWithRetry, getOrSetMemoryCache } from '../network/httpClient';

// tmpfiles.org - fichiers supprimés après 1 heure
const TMPFILES_UPLOAD_URL = 'https://tmpfiles.org/api/v1/upload';
const TMPFILES_UPLOAD_CACHE_TTL_MS = 10 * 60 * 1000;

function hashText(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface TmpFilesResponse {
  status: string;
  data: {
    url: string;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Détermine le type MIME à partir de l'URI
 */
const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
};

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload une image vers tmpfiles.org
 * Les fichiers sont automatiquement supprimés après 1 heure
 * 
 * @param imageUri URI locale de l'image (ex: file:///...)
 * @returns URL publique de l'image
 */
export const uploadImageToTmpFiles = async (imageUri: string): Promise<UploadResult> => {
  const normalizedUri = imageUri.trim();
  const cacheKey = `tmpfiles:uri:${hashText(normalizedUri)}`;

  return getOrSetMemoryCache(cacheKey, TMPFILES_UPLOAD_CACHE_TTL_MS, async () => {
    try {
      if (__DEV__) {
        console.log('[ImageUpload] Starting upload to tmpfiles.org:', normalizedUri);
      }

      const file = new File(normalizedUri);

      if (!file.exists) {
        throw new Error('Image file not found');
      }

      const fileName = file.name || 'image.jpg';
      const mimeType = getMimeType(normalizedUri);
      const formDataFile = {
        uri: normalizedUri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob;

      const formData = new FormData();
      formData.append('file', formDataFile);

      if (__DEV__) {
        console.log('[ImageUpload] Uploading file:', fileName, 'MIME:', mimeType, 'Size:', file.size);
      }

      const response = await fetchWithRetry(TMPFILES_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }, {
        timeoutMs: 20000,
        retries: 1,
        retryDelayMs: 800,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ImageUpload] Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result: TmpFilesResponse = await response.json();
      if (__DEV__) {
        console.log('[ImageUpload] Upload response:', result);
      }

      if (result.status !== 'success' || !result.data?.url) {
        throw new Error('Invalid response from tmpfiles.org');
      }

      let directUrl = result.data.url.replace(/^http:/, 'https:');
      directUrl = directUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

      if (__DEV__) {
        console.log('[ImageUpload] Upload successful:', directUrl);
      }

      return {
        success: true,
        url: directUrl,
      };
    } catch (error) {
      console.error('[ImageUpload] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  });
};

/**
 * Upload une image depuis base64
 */
export const uploadBase64Image = async (base64Data: string, fileName: string = 'image.jpg'): Promise<UploadResult> => {
  const cacheKey = `tmpfiles:base64:${fileName}:${base64Data.length}:${hashText(base64Data.slice(0, 128))}`;

  return getOrSetMemoryCache(cacheKey, TMPFILES_UPLOAD_CACHE_TTL_MS, async () => {
  try {
    console.log('[ImageUpload] Uploading base64 image...');
    
    // Créer un fichier temporaire avec la nouvelle API
    const tempFile = new File(Paths.cache, fileName);
    
    // Décoder base64 et écrire dans le fichier
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    tempFile.write(bytes);
    
    // Upload le fichier temporaire
    const result = await uploadImageToTmpFiles(tempFile.uri);
    
    // Nettoyer le fichier temporaire
    try {
      tempFile.delete();
    } catch (error) {
      if (__DEV__) {
        console.warn('[ImageUpload] Failed to delete temporary base64 file', error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[ImageUpload] Base64 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
  });
};
