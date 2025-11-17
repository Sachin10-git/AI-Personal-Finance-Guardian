import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "@/ThemeContext";

export default function MoreScreen() {
  const { theme, mode, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <Text style={[styles.header, { color: theme.text }]}>More</Text>

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.item, { backgroundColor: theme.card }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.itemText, { color: theme.text }]}>
          🎨  Switch to {mode === "light" ? "Dark" : "Light"} Mode
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 25 },
  item: {
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
