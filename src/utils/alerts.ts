import { Alert, Platform } from 'react-native';

/**
 * Cross-platform "OK" info dialog. react-native-web's Alert.alert is a
 * documented no-op (`static alert() {}` in react-native-web/src/exports/
 * Alert) — silently doing nothing — so on web this falls back to
 * window.alert instead of the message never appearing at all.
 */
export function alertAsync(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Cross-platform confirm/cancel dialog. Same react-native-web no-op issue as
 * alertAsync above — falls back to window.confirm on web.
 */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
