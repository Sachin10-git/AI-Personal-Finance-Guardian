import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { ThemeContext } from "@/ThemeContext";

type FormType = {
  sender: string;     // oldbalanceOrg
  receiver: string;   // oldbalanceDest
  amount: string;     // amount
  type: string;       // type (string - CASH_IN, TRANSFER, PAYMENT)
};

export default function AddScreen() {
  const { theme } = useContext(ThemeContext);

  const [form, setForm] = useState<FormType>({
    sender: "",
    receiver: "",
    amount: "",
    type: "",
  });

  const API_URL = "http://192.168.1.9:5000/predict";


  // Update any input
  const updateField = <K extends keyof FormType>(key: K, value: string) => {
    setForm({ ...form, [key]: value });
  };

  // Normalize payment type
  const normalizeType = (t: string) => {
    const x = t.toUpperCase().trim();
    if (x.includes("UPI")) return "PAYMENT";
    if (x.includes("TRANSFER")) return "TRANSFER";
    if (x.includes("DEBIT")) return "DEBIT";
    if (x.includes("CASHIN")) return "CASH_IN";
    if (x.includes("CASHOUT")) return "CASH_OUT";
    return "PAYMENT";
  };

  const submitForm = async () => {
    if (!form.sender || !form.receiver || !form.amount || !form.type) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    const amount = Number(form.amount);
    const senderBal = Number(form.sender);
    const receiverBal = Number(form.receiver);

    const payload = {
      step: Math.floor(Date.now() / 1000), // timestamp for uniqueness
      type: normalizeType(form.type),
      amount: amount,
      oldbalanceOrg: senderBal,
      newbalanceOrig: senderBal - amount,
      oldbalanceDest: receiverBal,
      newbalanceDest: receiverBal + amount,
    };

    try {
      const res = await axios.post(API_URL, payload);
      const data = res.data;

      Alert.alert(
        "Transaction Status",
        `${data.status}\nAnomaly Score: ${data.anomaly_score.toFixed(4)}`
      );

      // Clear form after success
      setForm({
        sender: "",
        receiver: "",
        amount: "",
        type: "",
      });
    } catch (error: any) {
      console.log("Transaction Error:", error?.response?.data || error.message);
      Alert.alert("❌ Transaction Failed", "Could not process transaction.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Send Money</Text>

      {/* Sender */}
      <TextInput
        placeholder="Sender Balance"
        placeholderTextColor={theme.subtitle}
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        keyboardType="numeric"
        onChangeText={(t) => updateField("sender", t)}
        value={form.sender}
      />

      {/* Receiver */}
      <TextInput
        placeholder="Receiver Balance"
        placeholderTextColor={theme.subtitle}
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        keyboardType="numeric"
        onChangeText={(t) => updateField("receiver", t)}
        value={form.receiver}
      />

      {/* Amount */}
      <TextInput
        placeholder="Amount"
        placeholderTextColor={theme.subtitle}
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        keyboardType="numeric"
        onChangeText={(t) => updateField("amount", t)}
        value={form.amount}
      />

      {/* Type */}
      <TextInput
        placeholder="Payment Type (UPI / TRANSFER / PAYMENT)"
        placeholderTextColor={theme.subtitle}
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        onChangeText={(t) => updateField("type", t)}
        value={form.type}
      />

      {/* Submit */}
      <TouchableOpacity
        onPress={submitForm}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.buttonText}>Send Money</Text>
      </TouchableOpacity>
    </View>
  );
}

//
// Styles
//
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 30, fontWeight: "bold", marginBottom: 20 },
  input: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
