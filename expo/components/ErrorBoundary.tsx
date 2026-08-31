import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react-native";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
};

export class ErrorBoundary extends React.PureComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
    errorStack: undefined,
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      hasError: true,
      errorMessage: message,
      errorStack: error instanceof Error ? error.stack : undefined,
    };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("🧯 Unhandled UI error:", message);
  }

  private handleReset = () => {
    try {
      this.props.onReset?.();
    } catch {
      // ignore
    }

    this.setState({ hasError: false, errorMessage: "", errorStack: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} testID="error-boundary">
        <LinearGradient colors={["#0B1220", "#111827", "#0B1220"]} style={StyleSheet.absoluteFillObject} />

        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <View style={styles.iconWrap}>
            <AlertTriangle color="#FBBF24" size={26} />
          </View>

          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Try reloading this screen. If it keeps happening, please report it.</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Bug color="#93C5FD" size={18} />
              <Text style={styles.cardTitle}>Error</Text>
            </View>
            <Text style={styles.message} selectable>
              {this.state.errorMessage || "Unknown error"}
            </Text>

            {this.state.errorStack ? (
              <Text style={styles.stack} selectable>
                {this.state.errorStack}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={this.handleReset} activeOpacity={0.9} style={styles.button} testID="error-boundary-reset">
            <View style={styles.buttonInner}>
              <RefreshCw color="#0B1220" size={18} />
              <Text style={styles.buttonText}>Reload</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 28,
    justifyContent: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(251, 191, 36, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    alignSelf: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    paddingHorizontal: 18,
  },
  card: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: "rgba(255,255,255,0.86)",
    lineHeight: 20,
  },
  stack: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "monospace",
  },
  button: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FBBF24",
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: "#0B1220",
    letterSpacing: 0.2,
  },
});
