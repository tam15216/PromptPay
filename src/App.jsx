import { useState, useRef, useEffect, forwardRef } from "react";
import QRCode from "qrcode";

// CRC16
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// แปลงเบอร์มือถือ
function phoneToPromptPay(phone) {
  if (phone.startsWith("0")) return "66" + phone.slice(1);
  return phone;
}

// สร้าง Payload PromptPay
function generatePromptPayPayload(phone, amount = null) {
  const phoneCC = phoneToPromptPay(phone);
  let payload = "000201010211";

  const gui = "A000000677010111";
  const guiField = "00" + gui.length.toString().padStart(2, "0") + gui;
  const accField = "01" + ("00" + phoneCC).length.toString().padStart(2, "0") + "00" + phoneCC;
  const merchantInfo = guiField + accField;
  payload += "29" + merchantInfo.length.toString().padStart(2, "0") + merchantInfo;

  payload += "5303764"; // THB
  if (amount !== null && amount !== undefined) {
    const amtStr = Number(amount).toFixed(2);
    payload += "54" + amtStr.length.toString().padStart(2, "0") + amtStr;
  }
  payload += "5802TH";

  payload += "6304";
  payload += crc16(payload);

  return payload;
}

// QRCanvas รองรับ forwardRef
const QRCanvas = forwardRef(({ value, size = 200 }, ref) => {
  const internalRef = useRef(null);

  useEffect(() => {
    if (internalRef.current && value) {
      QRCode.toCanvas(internalRef.current, value, { width: size });
    }
  }, [value, size]);

  // ref ภายนอกเชื่อมกับ canvas จริง
  useEffect(() => {
    if (ref) {
      ref.current = internalRef.current;
    }
  }, [ref]);

  return <canvas ref={internalRef} className="border rounded shadow" />;
});

export default function App() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [payload, setPayload] = useState("");
  const qrRef = useRef(null);

  const handleGenerate = () => {
    if (!phone) return alert("กรุณาใส่เบอร์มือถือ");
    const p = generatePromptPayPayload(phone, amount ? parseFloat(amount) : null);
    setPayload(p);
  };

  const handleDownload = () => {
    if (!payload || !qrRef.current) return;
    const link = document.createElement("a");
    link.download = "PromptPay_QR.png";
    link.href = qrRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">PromptPay QR</h1>
        <p className="text-gray-600 mb-6 text-center">
          กรอกเบอร์มือถือและจำนวนเงิน (ถ้ามี) แล้วกดสร้าง QR
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="เบอร์มือถือ"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="number"
            placeholder="จำนวนเงิน (ตัวเลือก)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            onClick={handleGenerate}
            className="bg-blue-500 text-white rounded-lg py-2 font-semibold hover:bg-blue-600 transition"
          >
            สร้าง QR
          </button>
        </div>

        {payload && (
          <div className="mt-6 flex flex-col items-center">
            <QRCanvas ref={qrRef} value={payload} size={250} />
            <button
              onClick={handleDownload}
              className="mt-4 bg-green-500 text-white rounded-lg px-6 py-2 hover:bg-green-600 transition"
            >
              ดาวน์โหลด QR Code
            </button>
            <p className="mt-2 text-gray-500 text-sm">สามารถใช้สแกนจ่าย PromptPay ได้ทันที</p>
          </div>
        )}
      </div>
    </div>
  );
}
