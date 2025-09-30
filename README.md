# 📘 TradingView Webhook Signal Combiner

Dự án này giúp bạn **gom nhiều tín hiệu webhook từ TradingView** lại với nhau, và chỉ gửi thông báo cuối cùng (qua Telegram, Email...) khi **điều kiện cụ thể được thoả mãn**.  

Ví dụ: chỉ khi **tín hiệu A + B cùng xảy ra** trong vòng 1 phút, bạn mới nhận một thông báo.

---

## ⚙️ 1. Chuẩn bị

- Tài khoản **GitHub** (để lưu code).
- Tài khoản **Render.com** (deploy server miễn phí).
- TradingView (để gửi alert webhook).
- (Tuỳ chọn) Tài khoản Telegram hoặc Email để nhận thông báo.

---

## 📂 2. Cấu trúc dự án

```
project/
 ├─ index.js        # Code chính của server
 ├─ package.json    # Định nghĩa dependency & script start
 └─ README.md       # Tài liệu hướng dẫn
```

---

## 🖥️ 3. Cách hoạt động

1. TradingView gửi tín hiệu webhook đến server Render (ví dụ: `https://ten-app.onrender.com/webhook`).  
2. Server lưu tạm tín hiệu lại trong bộ nhớ.  
3. Hàm `checkConditions()` sẽ kiểm tra các điều kiện do bạn định nghĩa.  
4. Nếu thoả mãn → server sẽ gửi thông báo (Telegram/Email/Slack...).

---

## 📝 4. Cấu hình tín hiệu trong `index.js`

Trong file `index.js`, bạn có một object chứa các tín hiệu:

```js
let signals = {
  A: null,
  B: null,
  C: null,
  D: null,
  E: null
};
```

- Mỗi key (`A, B, C, D, E`) chính là tên tín hiệu.  
- Khi TradingView gửi `{"signal": "A"}`, thì `signals.A` sẽ được ghi nhận bằng timestamp hiện tại.  

Bạn có thể **tự đổi tên** tín hiệu cho phù hợp, ví dụ:

```js
let signals = {
  LONG_BTC: null,
  SHORT_BTC: null,
  LONG_ETH: null,
  SHORT_ETH: null,
  RSI_OVERBOUGHT: null
};
```

---

## 🔔 5. Định nghĩa điều kiện trong `checkConditions()`

Ví dụ trong code mẫu:

```js
// Điều kiện 1: A + B cùng xảy ra trong vòng 1 phút
if (signals.A && signals.B) {
  let diff = Math.abs(signals.A - signals.B);
  if (diff < 60 * 1000) {
    console.log("🔥 Điều kiện A + B thoả mãn!");
    resetSignals(["A", "B"]);
  }
}
```

👉 Bạn có thể thêm nhiều logic tuỳ ý:
- `A + B + C` trong 2 phút.  
- `Chỉ E xuất hiện`.  
- `D xảy ra nhưng A không có`.  

---

## 📡 6. Thiết lập Webhook trong TradingView

1. Vào chart trong TradingView.  
2. Tạo một Alert (`Right click` → `Add alert`).  
3. Trong phần **Webhook URL** → nhập địa chỉ server Render:  
   ```
   https://ten-app.onrender.com/webhook
   ```
4. Trong **Message** → điền JSON như sau:
   ```json
   {"signal": "A"}
   ```
   hoặc
   ```json
   {"signal": "B"}
   ```

> ⚠️ Lưu ý: tên `"signal"` phải khớp với key bạn định nghĩa trong code (`A, B, C...`).  

---

## 📤 7. Gửi thông báo ra ngoài

Hiện tại code chỉ `console.log()`. Bạn có thể tích hợp thêm:

### 7.1 Gửi Telegram
- Tạo bot qua **BotFather** trên Telegram.  
- Lấy **Bot Token** và **Chat ID**.  
- Thêm thư viện `node-fetch` vào `package.json`.  

Ví dụ:

```js
const fetch = require("node-fetch");

function sendTelegram(msg) {
  const token = process.env.TELEGRAM_TOKEN;  // lấy từ biến môi trường
  const chatId = process.env.TELEGRAM_CHAT_ID;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: msg
    })
  });
}
```

Trong `checkConditions()` gọi:
```js
sendTelegram("🔥 Điều kiện A + B thoả mãn!");
```

---

### 7.2 Gửi Email (qua Nodemailer)
Cài thêm `nodemailer`:
```bash
npm install nodemailer
```

Ví dụ:
```js
const nodemailer = require("nodemailer");

async function sendEmail(subject, text) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "nguoinhan@example.com",
    subject: subject,
    text: text
  });
}
```

---

## 🚀 8. Deploy lên Render

1. Push code lên GitHub.  
2. Vào [Render.com](https://render.com), chọn **New Web Service**.  
3. Chọn repo GitHub, branch `main`.  
4. **Build Command**:
   ```
   npm install
   ```
   **Start Command**:
   ```
   npm start
   ```
5. Chọn **Free Instance** để chạy thử.  
6. Sau khi deploy, bạn sẽ có URL như:  
   ```
   https://tradingview-webhook.onrender.com/webhook
   ```
7. Dùng URL đó để dán vào TradingView.

---

## ✅ 9. Test nhanh

Bạn có thể test bằng `curl`:

```bash
curl -X POST https://tradingview-webhook.onrender.com/webhook   -H "Content-Type: application/json"   -d '{"signal":"A"}'
```

Nếu thành công → server log:  
```
Nhận tín hiệu: A
```

---

## 🎯 10. Tuỳ biến cho riêng bạn

- Đổi tên tín hiệu trong `signals`.  
- Thêm/giảm điều kiện trong `checkConditions()`.  
- Thay `console.log` bằng `sendTelegram` hoặc `sendEmail`.  
- Dùng biến môi trường trong Render để lưu **API key, token, password** thay vì viết trực tiếp trong code.  

---

👉 Với file này, ngay cả người mới tinh cũng có thể làm theo và mở rộng hệ thống.  
