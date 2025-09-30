import express from "express";
import fetch from "node-fetch"; // nếu dùng Node >=18 bạn có thể dùng global fetch và bỏ dòng này

const app = express();
app.use(express.json());

// Lưu trạng thái tín hiệu (in-memory)
let signals = {
  A: null,
  B: null,
};

const TTL_MS = 5 * 60 * 1000; // 5 phút

function checkSignals() {
  const now = Date.now();
  if (
    signals.A && (now - signals.A.ts) < TTL_MS &&
    signals.B && (now - signals.B.ts) < TTL_MS
  ) {
    return true;
  }
  return false;
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Telegram not configured. Skipping send.");
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    console.log("Telegram sent");
  } catch (e) {
    console.error("Telegram send error:", e);
  }
}

app.post("/webhook", async (req, res) => {
  // Expect JSON like: { "signal":"A", "symbol":"BTCUSD", "price": 12345 }
  const { signal, symbol, price } = req.body || {};
  if (!signal) return res.status(400).send("No signal field");

  const now = Date.now();
  if (signal === "A" || signal === "B") {
    signals[signal] = { ts: now, symbol: symbol || "?", price: price ?? "?" };
    console.log(`Received ${signal}`, signals[signal]);
  } else {
    console.log("Unknown signal:", signal);
  }

  if (checkSignals()) {
    // build message with details
    const msg = `✅ Condition met: A + B within 5m\nA: ${JSON.stringify(signals.A)}\nB: ${JSON.stringify(signals.B)}`;
    console.log(msg);
    await sendTelegramMessage(msg);
    // reset after notifying
    signals.A = null;
    signals.B = null;
  }

  res.send("ok");
});

app.get("/", (req, res) => res.send("Webhook server up"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on", port));
