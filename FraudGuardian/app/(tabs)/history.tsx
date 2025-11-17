import { View, Text, StyleSheet, FlatList } from "react-native";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "@/ThemeContext";

// Type from backend MySQL
interface HistoryItem {
  id: number;
  status: string;
  amount: number;
  score: number;
  time: number;
  type: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { theme } = useContext(ThemeContext);

  const API_URL = "http://192.168.1.9:5000/history";


  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get<HistoryItem[]>(API_URL);
      setHistory(res.data);
    } catch (e) {
      console.log("Error loading history:", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>
        Transaction History
      </Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Status */}
            <Text
              style={[
                styles.title,
                {
                  color:
                    item.status === "Suspicious"
                      ? theme.danger
                      : theme.primary,
                },
              ]}
            >
              {item.status === "Suspicious"
                ? "⚠️ Suspicious Transaction"
                : "✅ Normal Transaction"}
            </Text>

            {/* Amount */}
            <Text style={[styles.text, { color: theme.text }]}>
              Amount: ₹{item.amount}
            </Text>

            {/* Score */}
            <Text style={[styles.text, { color: theme.text }]}>
              Score: {item.score.toFixed(4)}
            </Text>

            {/* Timestamp */}
            <Text style={[styles.time, { color: theme.subtitle }]}>
              Time: {new Date(item.time).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// Styles remain constant, theme applied above
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  text: { fontSize: 14 },
  time: { fontSize: 12, marginTop: 4 },
});
