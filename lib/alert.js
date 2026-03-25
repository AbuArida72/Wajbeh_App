import { Alert, Platform } from "react-native";

export const showAlert = (title, message, onConfirm, onCancel) => {
  if (Platform.OS === "web") {
    if (onConfirm && onCancel !== undefined) {
      const result = window.confirm(message ? `${title}\n${message}` : title);
      if (result) onConfirm();
      else if (onCancel) onCancel();
    } else {
      window.alert(message ? `${title}\n${message}` : title);
      if (onConfirm) onConfirm();
    }
  } else {
    if (onConfirm && onCancel !== undefined) {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: onCancel },
        { text: "OK", onPress: onConfirm },
      ]);
    } else if (onConfirm) {
      Alert.alert(title, message, [{ text: "OK", onPress: onConfirm }]);
    } else {
      Alert.alert(title, message);
    }
  }
};

export const showConfirm = (title, message, onConfirm, onCancel) => {
  showAlert(title, message, onConfirm, onCancel || (() => {}));
};
