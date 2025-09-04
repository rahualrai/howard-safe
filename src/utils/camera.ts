import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface CapturedPhoto {
  dataUrl: string;
  filename: string;
  size: number;
}

export class CameraService {
  static async takePicture(): Promise<CapturedPhoto | null> {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!image.dataUrl) {
        throw new Error('Failed to capture image');
      }

      return {
        dataUrl: image.dataUrl,
        filename: `incident_${Date.now()}.jpg`,
        size: this.getDataUrlSize(image.dataUrl)
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  static async selectFromGallery(): Promise<CapturedPhoto | null> {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (!image.dataUrl) {
        throw new Error('Failed to select image');
      }

      return {
        dataUrl: image.dataUrl,
        filename: `incident_${Date.now()}.jpg`,
        size: this.getDataUrlSize(image.dataUrl)
      };
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      return null;
    }
  }

  private static getDataUrlSize(dataUrl: string): number {
    // Approximate size calculation for base64 data URL
    const base64Length = dataUrl.split(',')[1]?.length || 0;
    return Math.floor(base64Length * 0.75); // Base64 is ~33% larger than binary
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }
}