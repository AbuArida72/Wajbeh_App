import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { T, FONTS } from "./Glass";

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDialog() {
  const [state, setState] = useState({ visible: false });

  const hide = () => setState((s) => ({ ...s, visible: false }));

  const alert = (title, message, opts = {}) =>
    setState({
      visible: true,
      title,
      message: message || "",
      confirmText: opts.confirmText || "OK",
      cancelText: null,
      onConfirm: opts.onConfirm ? () => { hide(); opts.onConfirm(); } : hide,
      onCancel: null,
      danger: false,
    });

  const confirm = (title, message, onConfirm, onCancel, opts = {}) =>
    setState({
      visible: true,
      title,
      message: message || "",
      confirmText: opts.confirmText || "Confirm",
      cancelText: opts.cancelText || "Cancel",
      onConfirm: () => { hide(); onConfirm && onConfirm(); },
      onCancel: () => { hide(); onCancel && onCancel(); },
      danger: opts.danger || false,
    });

  return { dialogProps: state, alert, confirm, hide };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AppDialog({ visible, title, message, confirmText, cancelText, onConfirm, onCancel, danger }) {
  return (
    <Modal transparent animationType="fade" visible={!!visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={[styles.btnRow, !cancelText && styles.btnRowSingle]}>
            {!!cancelText && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, danger && styles.confirmBtnDanger, !cancelText && styles.confirmBtnFull]}
              onPress={onConfirm}
              activeOpacity={0.82}
            >
              <Text style={[styles.confirmText, danger && styles.confirmTextDanger]}>
                {confirmText || "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: T.ink,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  message: {
    fontSize: 14,
    color: T.mute,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  btnRowSingle: {
    justifyContent: "center",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.10)",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: T.ink,
    fontFamily: FONTS.semiBold,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: T.green,
  },
  confirmBtnFull: {
    flex: 0,
    paddingHorizontal: 40,
  },
  confirmBtnDanger: {
    backgroundColor: "#FEE2E2",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
  },
  confirmTextDanger: {
    color: "#DC2626",
  },
});
