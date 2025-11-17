import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import axios from "axios";
import { ThemeContext } from "@/ThemeContext";

// Type definition
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

export default function AlertsScreen() {
  const { theme } = useContext(ThemeContext);
  const [alerts, setAlerts] = useState<HistoryItem[]>([]);

  const API_URL = "http://192.168.1.9:5000/alerts";

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await axios.get<HistoryItem[]>(API_URL);

      const suspicious = res.data.filter(
        (item: HistoryItem) => item.status === "Suspicious"
      );

      setAlerts(suspicious);
    } catch (e) {
      console.log("Error loading alerts:", e);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View
      style={[
        styles.alertCard,
        {
          backgroundColor: theme.danger + "22", // light red background
          borderLeftColor: theme.danger,
        },
      ]}
    >
      <Text style={[styles.alertTitle, { color: theme.danger }]}>
        ⚠️ Suspicious Transaction
      </Text>

      <Text style={[styles.alertText, { color: theme.text }]}>
        Amount: ₹{item.amount}
      </Text>

      <Text style={[styles.alertText, { color: theme.text }]}>
        Score: {item.score.toFixed(4)}
      </Text>

      <Text style={[styles.time, { color: theme.subtitle }]}>
        Time: {new Date(item.time).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Suspicious Alerts</Text>

      <FlatList
        data={alerts}
        renderItem={renderItem}
        keyExtractor={(item: HistoryItem) => item.id.toString()}
      />
    </View>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  alertCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  alertText: {
    fontSize: 14,
    marginTop: 3,
  },
  time: {
    fontSize: 12,
    marginTop: 5,
  },
});
