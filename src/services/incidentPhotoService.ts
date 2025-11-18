import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface BatchUploadResult {
  success: boolean;
  urls: string[];
  failedPhotos: number;
  error?: string;
}

const BUCKET_NAME = 'incident-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const IncidentPhotoService = {
  /**
   * Upload a single photo to Supabase Storage
   */
  async uploadPhoto(
    file: File,
    incidentId: string,
    userId?: string
  ): Promise<UploadResult> {
    try {
      if (!file) {
        return { success: false, error: 'No file provided' };
      }

      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: 'File size exceeds 5MB limit' };
      }

      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);

      // Path format: {userId}/{incidentId}/{timestamp}_{randomSuffix}.{ext}
      // If no userId, use 'anonymous' folder
      const folder = userId || 'anonymous';
      const fileName = `${timestamp}_${randomSuffix}.${fileExtension}`;
      const filePath = `${folder}/${incidentId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Photo upload error:', error);
        return { success: false, error: error.message };
      }

      // Get signed URL for the uploaded photo
      const signedUrl = await IncidentPhotoService.getSignedUrl(filePath);

      return {
        success: true,
        url: signedUrl,
        path: filePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Photo upload exception:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Upload multiple photos in batch
   */
  async uploadPhotos(
    files: File[],
    incidentId: string,
    userId?: string
  ): Promise<BatchUploadResult> {
    const urls: string[] = [];
    let failedPhotos = 0;

    const uploadPromises = files.map((file) =>
      IncidentPhotoService.uploadPhoto(file, incidentId, userId)
    );

    const results = await Promise.all(uploadPromises);

    results.forEach((result) => {
      if (result.success && result.url) {
        urls.push(result.url);
      } else {
        failedPhotos++;
      }
    });

    return {
      success: failedPhotos === 0,
      urls,
      failedPhotos,
      error:
        failedPhotos > 0
          ? `Failed to upload ${failedPhotos} out of ${files.length} photos`
          : undefined,
    };
  },

  /**
   * Delete a single photo from storage
   */
  async deletePhoto(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Photo delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Photo delete exception:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Delete multiple photos
   */
  async deletePhotos(
    filePaths: string[]
  ): Promise<{ success: boolean; failedCount: number; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (error) {
        console.error('Photos delete error:', error);
        return { success: false, failedCount: filePaths.length, error: error.message };
      }

      return { success: true, failedCount: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Photos delete exception:', errorMessage);
      return { success: false, failedCount: filePaths.length, error: errorMessage };
    }
  },

  /**
   * Get signed URL for a photo with expiration
   * @param filePath Path to the file in storage
   * @param expiresIn Duration in seconds (default: 3600 = 1 hour)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      return data?.signedUrl || '';
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }
  },

  /**
   * Get multiple signed URLs
   */
  async getSignedUrls(
    filePaths: string[],
    expiresIn: number = 3600
  ): Promise<string[]> {
    try {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrls(filePaths, expiresIn);

      return data?.map((item) => item.signedUrl) || [];
    } catch (error) {
      console.error('Error creating signed URLs:', error);
      return [];
    }
  },

  /**
   * Convert File to base64 for preview
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  },

  /**
   * Validate file is an image
   */
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type) && file.size <= MAX_FILE_SIZE;
  },
};
