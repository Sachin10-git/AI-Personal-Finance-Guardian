import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import axios from "axios";
import { ThemeContext } from "@/ThemeContext";

export default function FraudDashboard() {
  const { theme } = useContext(ThemeContext);

  const [detectedAmount, setDetectedAmount] = useState(0);
  const [predictionText, setPredictionText] = useState("No recent scan");
  const [anomalyScore, setAnomalyScore] = useState(0);

  const API_PREDICT = "http://192.168.1.9:5000/predict";
  const API_HISTORY = "http://192.168.1.9:5000/history";


  // ---------------------------------------
  // LOAD LATEST TRANSACTION FROM DATABASE
  // ---------------------------------------
  useEffect(() => {
    loadLatestHistory();
  }, []);

  const loadLatestHistory = async () => {
    try {
      const res = await axios.get(API_HISTORY);

      if (res.data.length > 0) {
        const latest = res.data[0];

        setDetectedAmount(latest.amount);
        setAnomalyScore(latest.score);
        setPredictionText(
          latest.status === "Suspicious"
            ? "⚠️ Suspicious Transaction"
            : "✅ Normal Transaction"
        );
      }
    } catch (err) {
      console.log("History Load Error:", err);
    }
  };

  // --------------------------------------------------------
  // RUN FRAUD CHECK — ALWAYS USE last TX or fall back safely
  // --------------------------------------------------------
  const runFraudCheck = async () => {
    try {
      let payload;

      // Fetch latest historical row to re-test anomaly
      const resHist = await axios.get(API_HISTORY);

      if (resHist.data.length > 0) {
        const last = resHist.data[0];

        payload = {
          step: Date.now(), // timestamp → int
          type: last.type,
          amount: last.amount,
          oldbalanceOrg: last.oldbalanceOrg,
          newbalanceOrig: last.newbalanceOrig,
          oldbalanceDest: last.oldbalanceDest,
          newbalanceDest: last.newbalanceDest,
        };
      } else {
        // No history → safe fallback
        payload = {
          step: Date.now(),
          type: "PAYMENT",
          amount: 1000,
          oldbalanceOrg: 5000,
          newbalanceOrig: 4000,
          oldbalanceDest: 0,
          newbalanceDest: 1000,
        };
      }

      // Predict with backend
      const res = await axios.post(API_PREDICT, payload);
      const data = res.data;

      setDetectedAmount(payload.amount);
      setAnomalyScore(data.anomaly_score);

      setPredictionText(
        data.anomaly === 1
          ? "⚠️ Suspicious Transaction"
          : "✅ Normal Transaction"
      );

      loadLatestHistory(); // refresh UI
    } catch (error) {
      console.log(error);
      setPredictionText("⚠️ Unable to reach backend");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* App Title */}
      <Text style={[styles.title, { color: theme.text }]}>Fraud Guardian</Text>

      {/* Amount */}
      <Text style={[styles.amount, { color: theme.primary }]}>
        ₹{detectedAmount.toFixed(2)}
      </Text>

      <Text style={[styles.subtitle, { color: theme.subtitle }]}>
        Estimated Affected Amount
      </Text>

      {/* Latest Result */}
      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>
          Latest Detection Result
        </Text>

        <Text style={[styles.infoStatus, { color: theme.primary }]}>
          {predictionText}
        </Text>

        <Text style={[styles.infoScore, { color: theme.subtitle }]}>
          Anomaly Score: {anomalyScore.toFixed(4)}
        </Text>
      </View>

      {/* Features */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>

      {tile("🚨", "Anomaly Alerts", "Detect suspicious and unauthorized transactions.", theme)}
      {tile("💸", "Overspending Detection", "Smart spending pattern monitoring.", theme)}
      {tile("📜", "Transaction History", "See all your past transactions.", theme)}
      {tile("📊", "Track Expenses", "Graph-based budget visualization.", theme)}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={runFraudCheck}
      >
        <Text style={styles.buttonText}>Run Fraud Check</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const tile = (
  icon: string,
  title: string,
  subtitle: string,
  theme: {
    card: string;
    text: string;
    subtitle: string;
  }
) => (
  <View style={[styles.tile, { backgroundColor: theme.card }]}>
    <Text style={[styles.tileIcon, { color: theme.text }]}>{icon}</Text>
    <View>
      <Text style={[styles.tileTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.tileSubtitle, { color: theme.subtitle }]}>
        {subtitle}
      </Text>
    </View>
  </View>
);


const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 10 },
  amount: { fontSize: 40, fontWeight: "bold", marginTop: 10 },
  subtitle: { marginBottom: 25, fontSize: 16 },
  infoCard: { padding: 18, borderRadius: 14, marginBottom: 25, elevation: 3 },
  infoTitle: { fontSize: 20, fontWeight: "bold" },
  infoStatus: { fontSize: 18, fontWeight: "600", marginTop: 10 },
  infoScore: { fontSize: 14, marginTop: 5 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  tile: { flexDirection: "row", padding: 15, borderRadius: 12, marginBottom: 12, elevation: 1 },
  tileIcon: { fontSize: 32, marginRight: 15 },
  tileTitle: { fontSize: 18, fontWeight: "bold" },
  tileSubtitle: { fontSize: 14, marginTop: 3 },
  button: { padding: 18, borderRadius: 12, alignItems: "center", marginTop: 25, marginBottom: 40 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
