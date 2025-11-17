// MediChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import "./MediChatBot.css";
import BotIcon from "../../../assets/chatbot.png";

export default function MediChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "👋 Hi! I'm your Health Assistant. Tell me how you feel or type your symptoms.",
    },
  ]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  // Detect greeting
  function isGreeting(t) {
    const g = t.toLowerCase().trim();
    return /^(hi|hello|hey|hiya|hi chatbot|hello bot|helo)\b/.test(g);
  }

  // Detect invalid symptom input
  function isInvalidSymptomInput(t) {
    const text = t.toLowerCase().trim();

    if (text.length < 5) return true; // too short
    if (/^[a-z]+$/.test(text) && text.length < 10) return true; // random words
    if (!/[a-z]/i.test(text)) return true; // no letters
    if (!/[aeiou]/i.test(text)) return true; // no vowels → random
    if (/^(what|how|why|can|do)\b/.test(text)) return true; // questions

    // Check for medical keywords
    const keywords = [
      "fever","cough","cold","pain","head","stomach","nausea","vomit",
      "throat","breath","dizzy","rash","acne","fatigue","weak","ache",
      "swelling","infection","burn","itch","diarrhea","flu"
    ];
    const hasMedical = keywords.some((k) => text.includes(k));

    return !hasMedical;
  }

  function pushMessage(from, text) {
    setMessages((m) => [...m, { from, text }]);
  }

  async function send() {
    if (!text.trim()) return;
    const t = text.trim();
    pushMessage("user", t);
    setText("");

    // Greeting
    if (isGreeting(t)) {
      setTimeout(() => {
        pushMessage(
          "bot",
          "😊 Hi there! What symptoms are you experiencing? (e.g., fever, cough, headache)"
        );
      }, 400);
      return;
    }

    // Validate text BEFORE calling backend
    if (isInvalidSymptomInput(t)) {
      pushMessage(
        "bot",
        "❗ I couldn't understand that. Please describe your symptoms clearly (e.g., fever, cough, chest pain)."
      );
      return;
    }

    // Begin analysis
    setLoading(true);
    pushMessage("bot", "Analyzing your symptoms...");

    try {
      const res = await fetch("http://localhost:8080/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: t }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      // Remove analyzing message
      setMessages((cur) => {
        const trimmed = [...cur];
        const last = trimmed[trimmed.length - 1];
        if (last?.text === "Analyzing your symptoms...") trimmed.pop();
        return trimmed;
      });

      if (data.error) {
        pushMessage("bot", `❌ Error: ${data.error}`);
        return;
      }

      // Build response
      let reply = `
      🩺 <b>Based on your symptoms:</b><br>
      You may have <b>${data.disease}</b> (${data.confidence}% confidence).<br><br>
      `;

      // Treatment
      if (data.treatment && data.treatment !== "Not available") {
        reply += `<b>Treatment:</b> ${data.treatment}<br>`;
      } else {
        reply += `<b>Treatment:</b> No treatment found in my database.<br>`;
      }

      // Medicine
      if (data.medicine && data.medicine !== "Not available") {
        reply += `<b>Suggested Medicine:</b> ${data.medicine}<br>`;
      } else {
        reply += `<b>Suggested Medicine:</b> Not available. Please consult a doctor.<br>`;
      }

      // Dosage
      if (data.dosage && data.dosage !== "Not available") {
        reply += `<b>Dosage:</b> ${data.dosage}<br>`;
      }

      pushMessage("bot", reply);

    } catch (err) {
      // Remove analyzing
      setMessages((cur) => {
        const trimmed = [...cur];
        const last = trimmed[trimmed.length - 1];
        if (last?.text === "Analyzing your symptoms...") trimmed.pop();
        return trimmed;
      });

      pushMessage("bot", `❌ Unable to connect to the prediction service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter") send();
  }

  return (
    <div className="mc-root" role="dialog" aria-modal="true">
      <div className="mc-header">
        <div className="mc-title">
          <img src={BotIcon} alt="bot" className="mc-botimg" />
          <div>
            <div className="mc-main">MediChatBot</div>
            <div className="mc-sub">Tell about your symptoms to know about the disease</div>
          </div>
        </div>
        <button className="mc-close" onClick={onClose} aria-label="close">✕</button>
      </div>

      <div className="mc-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`mc-msg ${m.from === "bot" ? "bot" : "user"}`}>
            <div
              className="mc-msg-text"
              dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br/>") }}
            />
          </div>
        ))}
        {loading && (
          <div className="mc-msg bot"><div className="mc-msg-text">Typing...</div></div>
        )}
      </div>

      <div className="mc-input">
        <input
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <button onClick={send} disabled={loading}>{loading ? "…" : "Send"}</button>
      </div>
    </div>
  );
}
