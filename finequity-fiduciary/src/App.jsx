import { useState, useRef, useEffect } from "react";

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 6, padding: "12px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8a020", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

const SIDEBAR_SECTIONS = [
  {
    id: "start",
    icon: "🧭",
    label: "How to get started",
    content: (
      <div>
        <p style={sd.text}>You should have received a Divvy or Brex credit card statement from Briane. Open it alongside this bot.</p>
        <p style={sd.text}>Scan the statement. Trust your gut. Pick <strong>1–3 items</strong> that stand out to you:</p>
        <ul style={sd.list}>
          <li>A vendor name you don't recognize</li>
          <li>An amount that seems unusually large</li>
          <li>Something that looks like cash (Venmo, Zelle, gift cards)</li>
          <li>A description that's unclear</li>
        </ul>
        <p style={sd.text}>Paste each item into the chat — vendor name, amount, date — and ask what it is. This is not a comprehensive audit. Flag what catches your eye, aim for 1–3 items total.</p>
        <p style={sd.text}>When you're done, send Chirag a short summary of what you explored and what you found.</p>
      </div>
    ),
  },
  {
    id: "data",
    icon: "📂",
    label: "What data this bot has",
    content: (
      <div>
        {[
          ["✓", "Vendor knowledge base", "All vendors in finEQUITY's QBO Jan–May 2026 with typical spend ranges"],
          ["✓", "Accountant tagging guide (May 2026)", "How each vendor maps to budget lines and grants"],
          ["✓", "Active grant budgets", "JPMC, Citi Foundation, Emerson Collective/SVCF, Camelback Ventures"],
          ["✓", "FY2026 organizational budget", "Approved revenue ($443K) and expense ($632K) plan"],
          ["✗", "Individual salaries", "Never accessible — not in scope"],
          ["✗", "Receipts", "Accountants code these in QuickBooks after month closes — not in Divvy"],
          ["✗", "Real-time balances", "Not accessible — see staff"],
        ].map(([icon, label, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ color: icon === "✓" ? "#2a9d5c" : "#bbb", fontSize: 12, marginTop: 2, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 12, color: "#1a2d3f", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#7a9bbf", marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
        <div style={sd.privacy}>🔒 This app does not store conversation history in its own database. Messages are sent to Anthropic through finEQUITY’s Netlify function to generate a response.</div>
      </div>
    ),
  },
  {
    id: "contacts",
    icon: "📬",
    label: "Who to contact",
    content: (
      <div style={{ fontSize: 13, color: "#2d4a60", lineHeight: 1.9 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Staff follow-up questions</div>
        <div style={{ color: "#0c2340", marginBottom: 16 }}>briane@finequity.org</div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Pilot coordinator</div>
        <div style={{ color: "#7a9bbf", fontSize: 12, marginBottom: 4 }}>Send your completion summary here</div>
        <div style={{ color: "#0c2340" }}>Chirag Shukla</div>
        <div style={{ color: "#0c2340" }}>cshukla311@gmail.com</div>
      </div>
    ),
  },
  {
    id: "fraud",
    icon: "⚠️",
    label: "Fraud red flags",
    content: (
      <div>
        <p style={sd.text}>You don't need to go looking for fraud — just flag what catches your eye. But these patterns are worth knowing:</p>
        <ul style={sd.list}>
          <li><strong>Gift cards</strong> — Amazon, Apple, Target, Walmart at round amounts</li>
          <li><strong>Cash-like payments</strong> — Venmo, Zelle, Square Cash, wire to personal account</li>
          <li><strong>Duplicates</strong> — same vendor, same amount, within days</li>
          <li><strong>Personal spend</strong> — grocery stores, gas stations on a company card</li>
          <li><strong>Blank vendor name</strong> — no description at all</li>
        </ul>
        <p style={sd.text}>Spot any of these? Paste it into the bot and ask what it is.</p>
      </div>
    ),
  },
];

const sd = {
  text: { fontSize: 13, color: "#2d4a60", lineHeight: 1.65, marginBottom: 10 },
  list: { fontSize: 13, color: "#2d4a60", lineHeight: 1.9, paddingLeft: 18, marginBottom: 10 },
  privacy: { background: "#f0f6fc", border: "1px solid #c5d5e5", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#4a6a85", marginTop: 12 },
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSection, setOpenSection] = useState("start");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const txt = (text || input).trim();
    if (!txt || loading) return;
    setInput("");
    const hist = [...messages, { role: "user", content: txt }];
    setMessages(hist);
    setLoading(true);
    try {
      const r = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: hist }),
      });

      const raw = await r.text();
      let d = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        d = { error: raw || "The server returned a non-JSON response." };
      }

      if (!r.ok) {
        throw new Error(d.error || `Server error ${r.status}`);
      }

      const reply = d.content?.map(b => b.text || "").join("");
      if (!reply) {
        throw new Error(d.error || "Claude returned no answer. Check the Netlify function logs.");
      }

      setMessages([...hist, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...hist, { role: "assistant", content: `Connection/API error: ${err.message}` }]);
    }
    setLoading(false);
  }

  const activeSection = SIDEBAR_SECTIONS.find(sec => sec.id === openSection);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.85)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        textarea:focus { outline: none; border-color: #0c2340 !important; }
        .send-btn:hover:not(:disabled) { background: #e8a020 !important; }
        .stab:hover { background: #f0f6fc !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #c5d5e5; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={s.logo}>fE</div>
          <div>
            <div style={s.orgName}>finEQUITY</div>
            <div style={s.orgSub}>Board Oversight · Credit Card Spot-Check Pilot</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={s.pilotBadge}>PILOT · Q2 2026</div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={s.toggleBtn}>
            {sidebarOpen ? "Hide Guide ▸" : "Show Guide ◂"}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={s.layout}>

        {/* Chat */}
        <div style={s.chatArea}>
          {messages.length === 0 && (
            <div style={{ animation: "fadeUp 0.4s ease", padding: "28px 0 16px" }}>
              <div style={s.welcomeCard}>
                <div style={s.welcomeTitle}>Board Oversight Reference Bot</div>
                <p style={s.welcomeText}>
                  Paste a transaction from your credit card statement — vendor name, amount, and date — and ask what it is. The bot will identify the vendor, check whether it fits finEQUITY's spending history and active grants, and suggest one question to ask staff if anything seems off.
                </p>
                <div style={s.privacyBanner}>
                  🔒 This bot does not save or store conversations. Each session starts completely fresh — nothing is retained between visits.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} style={s.userBubble}>{m.content}</div>
              ) : (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={s.avatar}>fE</div>
                  <div style={s.botBubble}>{m.content}</div>
                </div>
              )
            )}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={s.avatar}>fE</div>
                <div style={s.botBubble}><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={s.sidebar}>
            <div style={s.sidebarTabs}>
              {SIDEBAR_SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  className="stab"
                  onClick={() => setOpenSection(sec.id)}
                  style={{
                    ...s.sidebarTab,
                    background: openSection === sec.id ? "#f0f6fc" : "white",
                    borderLeft: openSection === sec.id ? "3px solid #0c2340" : "3px solid transparent",
                    color: openSection === sec.id ? "#0c2340" : "#4a6a85",
                    fontWeight: openSection === sec.id ? 700 : 500,
                  }}
                >
                  <span>{sec.icon}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
            <div style={s.sidebarContent}>
              {activeSection && (
                <div style={{ animation: "fadeUp 0.2s ease" }}>
                  {activeSection.content}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <div style={s.inputWrap}>
          <textarea
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Paste a transaction (vendor · amount · date) or ask a question…"
            rows={2}
          />
          <button className="send-btn" style={s.sendBtn(!input.trim() || loading)} onClick={() => send()} disabled={!input.trim() || loading}>
            Send →
          </button>
        </div>
        <div style={s.disclaimer}>
          Context only · Does not approve spending · Does not access compensation data · No conversations stored · finEQUITY.org Board Pilot
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", background: "#eef2f7", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" },
  header: { background: "#0c2340", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  logo: { width: 36, height: 36, background: "#e8a020", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#0c2340", fontSize: 13 },
  orgName: { color: "white", fontSize: 16, fontWeight: "bold" },
  orgSub: { color: "#7a9bbf", fontSize: 11, marginTop: 1 },
  pilotBadge: { background: "#1a3d5c", border: "1px solid #2d5a7d", color: "#7a9bbf", fontSize: 11, padding: "4px 10px", borderRadius: 12, fontWeight: 600, letterSpacing: 0.5 },
  toggleBtn: { background: "none", border: "1px solid #2d5a7d", color: "#7a9bbf", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 },
  layout: { display: "flex", flex: 1, overflow: "hidden" },
  chatArea: { flex: 1, overflowY: "auto", padding: "0 24px 12px" },
  welcomeCard: { background: "white", border: "1px solid #dde8f0", borderRadius: 10, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  welcomeTitle: { fontSize: 16, fontWeight: "bold", color: "#0c2340", marginBottom: 10 },
  welcomeText: { fontSize: 13.5, color: "#2d4a60", lineHeight: 1.7, marginBottom: 14 },
  privacyBanner: { background: "#f0f6fc", border: "1px solid #c5d5e5", borderRadius: 7, padding: "10px 14px", fontSize: 12, color: "#4a6a85" },
  userBubble: { alignSelf: "flex-end", background: "#0c2340", color: "white", borderRadius: "14px 14px 3px 14px", padding: "11px 16px", fontSize: 13.5, lineHeight: 1.65, maxWidth: "78%", whiteSpace: "pre-wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", marginLeft: "auto" },
  avatar: { width: 28, height: 28, borderRadius: 6, background: "#0c2340", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", color: "#e8a020", flexShrink: 0, marginTop: 2 },
  botBubble: { background: "white", border: "1px solid #dde8f0", color: "#1a2d3f", borderRadius: "3px 14px 14px 14px", padding: "12px 16px", fontSize: 13.5, lineHeight: 1.7, maxWidth: "80%", whiteSpace: "pre-wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  sidebar: { width: 280, background: "white", borderLeft: "1px solid #dde8f0", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarTabs: { borderBottom: "1px solid #dde8f0", flexShrink: 0 },
  sidebarTab: { display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", cursor: "pointer", border: "none", textAlign: "left", width: "100%", fontSize: 12, transition: "all 0.15s" },
  sidebarContent: { padding: "16px", overflowY: "auto", flex: 1 },
  inputArea: { background: "white", borderTop: "1px solid #dde8f0", padding: "12px 24px 14px", flexShrink: 0, boxShadow: "0 -2px 8px rgba(0,0,0,0.05)" },
  inputWrap: { display: "flex", gap: 8, alignItems: "flex-end" },
  textarea: { flex: 1, background: "#f5f9fc", border: "2px solid #c5d5e5", borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: "#1a2d3f", resize: "none", lineHeight: 1.55, minHeight: 46, maxHeight: 120, transition: "border-color 0.15s" },
  sendBtn: (disabled) => ({ background: disabled ? "#c5d5e5" : "#0c2340", color: disabled ? "#8aafc8" : "white", border: "none", borderRadius: 10, padding: "0 20px", height: 46, fontSize: 13, fontWeight: "bold", cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0, transition: "all 0.15s" }),
  disclaimer: { textAlign: "center", fontSize: 11, color: "#8aafc8", marginTop: 8, lineHeight: 1.5 },
};
