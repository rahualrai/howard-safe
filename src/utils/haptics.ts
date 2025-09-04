import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticFeedback {
  static async impact(style: ImpactStyle = ImpactStyle.Medium) {
    try {
      await Haptics.impact({ style });
    } catch (error) {
      // Fallback for web - vibration API
      if ('vibrate' in navigator) {
        const duration = style === ImpactStyle.Light ? 10 : 
                        style === ImpactStyle.Medium ? 20 : 30;
        navigator.vibrate(duration);
      }
    }
  }

  static async notification(type: NotificationType = NotificationType.Success) {
    try {
      await Haptics.notification({ type });
    } catch (error) {
      // Fallback for web
      if ('vibrate' in navigator) {
        const pattern = type === NotificationType.Success ? [100, 50, 100] :
                        type === NotificationType.Warning ? [200, 100, 200] :
                        [300, 100, 300];
        navigator.vibrate(pattern);
      }
    }
  }

  static async selection() {
    try {
      await Haptics.selectionStart();
    } catch (error) {
      // Fallback for web
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }
  }
}