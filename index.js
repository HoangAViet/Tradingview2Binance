// ==============================
// 1. Import thư viện cần thiết
// ==============================
const express = require("express");   // Framework để tạo server
const bodyParser = require("body-parser"); // Giúp đọc dữ liệu JSON từ request

// ==============================
// 2. Khởi tạo server
// ==============================
const app = express();
const PORT = process.env.PORT || 3000; // Render sẽ tự gán PORT qua biến môi trường

// Middleware: cho phép server đọc dữ liệu JSON gửi lên
app.use(bodyParser.json());

// ==============================
// 3. Bộ nhớ tạm để lưu tín hiệu
// ==============================
// Mỗi khi TradingView gửi webhook, ta sẽ lưu tín hiệu lại trong object này
let signals = {
  A: null,
  B: null,
  C: null,
  D: null,
  E: null
};
//================
// Cấu hình bot Telegram
//================

const axios = require('axios');

// Hàm gửi thông báo Telegram
async function sendTelegramMessage(message) {
  
    const TELEGRAM_BOT_TOKEN = "8234327138:AAE0sOglWD0wIVdwdPwtxo46w3y46K4vMm8"; // bot token
    const CHAT_ID = "5628856618"; // chat_id 

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log("Đã gửi thông báo Telegram:", message);
  } catch (error) {
    console.error("Lỗi gửi Telegram:", error.response ? error.response.data : error.message);
  }
}

// Ví dụ: gọi hàm này khi nhận tín hiệu hợp lệ
// sendTelegramMessage("🚀 Nhận được tín hiệu MUA BTC/USDT!");


// ==============================
// 4. Endpoint để nhận webhook
// ==============================
// TradingView sẽ gửi POST request đến địa chỉ này
// Ví dụ: https://ten-app.onrender.com/webhook
app.post("/webhook", (req, res) => {
  const data = req.body; // Dữ liệu JSON mà TradingView gửi sang

  // Giả sử TradingView gửi {"signal": "A"}
  const signal = data.signal;

  if (!signal) {
    return res.status(400).send("Thiếu trường 'signal' trong JSON");
  }

  // Ghi log để debug
  console.log("Nhận tín hiệu:", signal);

  // Lưu tín hiệu vào bộ nhớ
  if (signals.hasOwnProperty(signal)) {
    signals[signal] = new Date(); // Ghi lại thời gian nhận được tín hiệu
  }

  // Sau khi lưu tín hiệu, kiểm tra xem điều kiện có thoả mãn không
  checkConditions();

  // Trả lời TradingView để nó biết webhook thành công
  res.json({ status: "ok", received: signal });
});

// ==============================
// 5. Hàm kiểm tra điều kiện
// ==============================
// Ở đây bạn có thể custom logic riêng tuỳ ý
function checkConditions() {
  // Ví dụ: nếu tín hiệu A + B cùng có trong vòng 1 phút thì báo
  if (signals.A && signals.B) {
    let diff = Math.abs(signals.A - signals.B); // chênh lệch thời gian (ms)
    if (diff < 60 * 1000) {
      console.log("🔥 Điều kiện A + B thoả mãn! Gửi thông báo ngay.");
      sendTelegramMessage("🚀 Điều kiện thoả mãn: Tín hiệu A + B cùng lúc!");
      // Tại đây bạn có thể gọi API Telegram, Discord, Email, Binance...
      resetSignals(["A", "B"]); // reset lại để tránh trùng lặp
    }
  }

  // Ví dụ khác: A + B + C đồng thời trong 2 phút
  if (signals.A && signals.B && signals.C) {
    let maxTime = Math.max(signals.A, signals.B, signals.C);
    let minTime = Math.min(signals.A, signals.B, signals.C);
    if (maxTime - minTime < 2 * 60 * 1000) {
      console.log("⚡ Điều kiện A + B + C thoả mãn!");
      sendTelegramMessage("🚀 Điều kiện thoả mãn: A + B + C thoả mãn rồi, MÚC!");
      resetSignals(["A", "B", "C"]);
    }
  }

  // Ví dụ: nếu chỉ có tín hiệu E thì cũng báo riêng
  if (signals.E) {
    console.log("📢 Chỉ riêng tín hiệu E xuất hiện, báo ngay!");
    resetSignals(["E"]);
  }
}

// ==============================
// 6. Hàm reset tín hiệu
// ==============================
// Sau khi xử lý xong 1 nhóm điều kiện, ta xoá tín hiệu đó đi
function resetSignals(keys) {
  keys.forEach(k => signals[k] = null);
}

// ==============================
// 7. Endpoint test đơn giản
// ==============================
app.get("/", (req, res) => {
  res.send("Webhook server đang chạy!");
});

// ==============================
// 8. Khởi động server
// ==============================
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
