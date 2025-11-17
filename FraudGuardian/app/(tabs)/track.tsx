import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import axios from "axios";
import { ThemeContext } from "@/ThemeContext";
import { LineChart } from "react-native-chart-kit";

// Type for history item
type HistoryItem = {
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
};

export default function TrackScreen() {
  const { theme } = useContext(ThemeContext);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  const API_URL = "http://192.168.1.9:5000/history";


  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get<HistoryItem[]>(API_URL);
      setHistory(res.data);

      // build last 10 amounts
      const last10 = res.data.slice(0, 10).map((h) => Number(h.amount));

      // CLEAN DATA → prevent NaN, Infinity crash
      const cleaned = last10.filter(
        (v) => typeof v === "number" && isFinite(v) && !isNaN(v)
      );

      setChartData(cleaned.length > 0 ? cleaned.reverse() : [0]);
    } catch (e) {
      console.log("Error loading history:", e);
    }
  };

  // --------------------------------
  // SUMMARY CALCULATIONS
  // --------------------------------
  const totalSpent = history.reduce((s, h) => s + h.amount, 0);

  const suspiciousTotal = history
    .filter((h) => h.status === "Suspicious")
    .reduce((s, h) => s + h.amount, 0);

  const normalTotal = totalSpent - suspiciousTotal;

  const suspiciousItems = history.filter((h) => h.status === "Suspicious");
  const normalItems = history.filter((h) => h.status === "Normal");

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {item.status === "Suspicious" ? "⚠️ Suspicious" : "✅ Normal"}
      </Text>

      <Text style={[styles.text, { color: theme.text }]}>
        Amount: ₹{item.amount}
      </Text>

      <Text style={[styles.text, { color: theme.text }]}>
        Score: {item.score.toFixed(4)}
      </Text>

      <Text style={[styles.time, { color: theme.subtitle }]}>
        Time: {new Date(item.time).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Track Activity</Text>

      {/* ⭐ SUMMARY CARD */}
      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Overview Summary
        </Text>

        <Text style={[styles.summaryText, { color: theme.text }]}>
          Total Transactions: {history.length}
        </Text>

        <Text style={[styles.summaryText, { color: theme.text }]}>
          Total Spent: ₹{totalSpent.toFixed(2)}
        </Text>

        <Text style={[styles.summaryText, { color: "red" }]}>
          Suspicious Amount: ₹{suspiciousTotal.toFixed(2)}
        </Text>

        <Text style={[styles.summaryText, { color: "green" }]}>
          Normal Amount: ₹{normalTotal.toFixed(2)}
        </Text>
      </View>

      {/* 📊 DYNAMIC SAFE CHART */}
      <View style={styles.graphContainer}>
        <Text style={[styles.graphTitle, { color: theme.text }]}>
          Transaction Amount Trend
        </Text>

        {chartData.length > 1 ? (
          <LineChart
            data={{
              labels: chartData.map((_, i) => `T${i + 1}`),
              datasets: [{ data: chartData }],
            }}
            width={Dimensions.get("window").width - 40}
            height={180}
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              color: () => theme.primary,
              labelColor: () => theme.text,
              decimalPlaces: 2,
              propsForDots: {
                r: "4",
                strokeWidth: "1",
                stroke: theme.primary,
              },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        ) : (
          <Text
            style={{
              color: theme.subtitle,
              textAlign: "center",
              paddingVertical: 20,
            }}
          >
            Not enough data to display chart
          </Text>
        )}
      </View>

      {/* ⚠️ Suspicious Transactions */}
      {suspiciousItems.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            ⚠️ Suspicious Transactions
          </Text>

          <FlatList
            data={suspiciousItems}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderItem}
          />
        </>
      )}

      {/* ✅ Normal Transactions */}
      {normalItems.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            ✅ Normal Transactions
          </Text>

          <FlatList
            data={normalItems}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}

// --------------------
// STYLES
// --------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },

  summaryCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 3,
  },
  summaryTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  summaryText: { fontSize: 16, marginBottom: 4 },

  graphContainer: {
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 10,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    alignSelf: "center",
  },

  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
  },

  card: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  title: { fontSize: 18, fontWeight: "bold" },
  text: { fontSize: 14, marginTop: 3 },
  time: { fontSize: 12, marginTop: 5 },
});
