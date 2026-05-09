const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const toggleGuide = document.getElementById("toggleGuide");
const guidePanel = document.getElementById("guidePanel");
const mainLayout = document.querySelector(".main-layout");

let history = [];
let loading = false;

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function makeBubble(role, text, opts = {}) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "fE";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "user" : "bot"}${opts.error ? " error" : ""}`;
  bubble.textContent = text;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
  return row;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.id = "typingRow";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "fE";

  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  const typing = document.getElementById("typingRow");
  if (typing) typing.remove();
}

async function sendMessage(text) {
  const content = (text || inputEl.value).trim();
  if (!content || loading) return;

  loading = true;
  sendButton.disabled = true;
  inputEl.value = "";

  makeBubble("user", content);
  history.push({ role: "user", content });
  showTyping();

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12) }),
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || "The server returned a non-JSON response." };
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    const reply = Array.isArray(data.content)
      ? data.content.map((block) => block.text || "").join("").trim()
      : "";

    if (!reply) {
      throw new Error(data.error || "Claude returned no answer. Check Netlify function logs.");
    }

    hideTyping();
    makeBubble("assistant", reply);
    history.push({ role: "assistant", content: reply });
  } catch (error) {
    hideTyping();
    makeBubble("assistant", `Connection/API error: ${error.message}`, { error: true });
  } finally {
    loading = false;
    sendButton.disabled = false;
    inputEl.focus();
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll(".starter").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

document.querySelectorAll(".guide-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".guide-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".guide-section").forEach((s) => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`section-${tab.dataset.section}`).classList.add("active");
  });
});

toggleGuide.addEventListener("click", () => {
  guidePanel.classList.toggle("hidden");
  mainLayout.classList.toggle("guide-hidden");
  toggleGuide.textContent = guidePanel.classList.contains("hidden") ? "Show Guide" : "Hide Guide";
});
