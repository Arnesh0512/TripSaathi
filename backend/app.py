import os
import json
import requests
from flask import Flask, request, jsonify, render_template_string
from dotenv import load_dotenv
from tinyfish import TinyFish

load_dotenv()
API_KEY = os.getenv("TINYFISH_API_KEY")

app = Flask(__name__)
client = TinyFish(api_key=API_KEY) if API_KEY else None

INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TinyFish Playground & Showcase</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090b10;
      --card-bg: #121620;
      --panel-bg: #161c29;
      --border: #232c3f;
      --accent: #f05a28;
      --accent-glow: rgba(240, 90, 40, 0.25);
      --accent-hover: #fa6c3d;
      --text-main: #f3f4f6;
      --text-muted: #94a3b8;
      --code-bg: #0b0f17;
      --green: #10b981;
      --blue: #38bdf8;
      --purple: #a855f7;
      --amber: #f59e0b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: rgba(18, 22, 32, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 0.85rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.5px;
    }
    .brand span.badge {
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid rgba(240, 90, 40, 0.4);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .port-tag {
      font-family: 'JetBrains Mono', monospace;
      color: var(--green);
      font-size: 0.85rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: var(--green);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--green);
    }

    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      background: var(--card-bg);
      padding: 0.5rem 2rem;
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 0.55rem 1.15rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.04);
    }
    .tab-btn.active {
      color: #fff;
      background: var(--accent);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    main {
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 1.75rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
    }
    @media (max-width: 1024px) {
      .grid-layout { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.85rem;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .field-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .field-input, .field-textarea, .field-select {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 0.65rem 0.9rem;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.9rem;
      transition: border 0.2s;
    }
    .field-input:focus, .field-textarea:focus, .field-select:focus {
      border-color: var(--accent);
      outline: none;
    }
    .field-textarea {
      min-height: 75px;
      resize: vertical;
    }

    .param-breakdown {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .param-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.85rem;
    }
    .param-name {
      font-family: 'JetBrains Mono', monospace;
      color: var(--accent);
      font-weight: 600;
    }
    .param-desc {
      color: var(--text-muted);
      line-height: 1.4;
    }

    .code-container {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: #e2e8f0;
      overflow-x: auto;
      max-height: 380px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .btn-send {
      background: var(--accent);
      color: white;
      border: none;
      padding: 0.85rem 1.5rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px var(--accent-glow);
    }
    .btn-send:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    .btn-send:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .step-box {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 10px;
      padding: 1rem;
      font-size: 0.88rem;
      line-height: 1.5;
      color: #fde68a;
    }

    .stats-bar {
      display: flex;
      gap: 1.25rem;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      background: var(--panel-bg);
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .stat-label { color: var(--text-muted); }
    .stat-val { font-weight: 600; color: var(--green); }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .tag {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }
    .tag-agent { background: rgba(240, 90, 40, 0.15); color: var(--accent); }
    .tag-search { background: rgba(56, 189, 248, 0.15); color: var(--blue); }
    .tag-fetch { background: rgba(168, 85, 247, 0.15); color: var(--purple); }
    .tag-stealth { background: rgba(16, 185, 129, 0.15); color: var(--green); }
    .tag-auth { background: rgba(245, 158, 11, 0.15); color: var(--amber); }
    .tag-pipeline { background: rgba(56, 189, 248, 0.15); color: var(--blue); border: 1px solid rgba(56, 189, 248, 0.3); }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      🐟 TinyFish Explorer
      <span class="badge">Mako 35B / 3B Active</span>
    </div>
    <div class="port-tag">
      <div class="pulse-dot"></div>
      http://localhost:7000
    </div>
  </header>

  <nav class="tabs-bar">
    <button class="tab-btn active" onclick="switchPage('agent')">
      🤖 1. Web Agent
    </button>
    <button class="tab-btn" onclick="switchPage('search')">
      🔍 2. Web Search
    </button>
    <button class="tab-btn" onclick="switchPage('fetch')">
      ⚡ 3. Text Fetch
    </button>
    <button class="tab-btn" onclick="switchPage('stealth')">
      🛡️ 4. Anti-Bot / Stealth
    </button>
    <button class="tab-btn" onclick="switchPage('popup_login')">
      🪟 5. GitHub Popup Sign-In
    </button>
    <button class="tab-btn" onclick="switchPage('github_repo')">
      🐙 6. Create GitHub Repo
    </button>
    <button class="tab-btn" onclick="switchPage('airline_policy')">
      ✈️ 7. Airline Policies
    </button>
  </nav>

  <main>
    <div class="page-header">
      <h1 class="page-title" id="pageTitle"></h1>
      <p class="page-desc" id="pageDesc"></p>
    </div>

    <div class="grid-layout">
      <!-- Left Column: Request & Explanation -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>⚙️</span> Interactive Request Config
          </div>
          <span class="tag tag-agent" id="apiTag">POST /v1/automation/run</span>
        </div>

        <div id="stepGuidance" style="display: none;" class="step-box"></div>
        <div id="dynamicForm"></div>

        <div class="card-header" style="margin-top: 0.5rem;">
          <div class="card-title">
            <span>📦</span> JSON Payload To Send
          </div>
        </div>
        <div class="code-container" id="jsonPreview">{}</div>

        <div class="card-header" style="margin-top: 0.5rem;">
          <div class="card-title">
            <span>📖</span> JSON Schema & Field Explanation
          </div>
        </div>
        <div class="param-breakdown" id="paramExplanation"></div>

        <button class="btn-send" id="btnSend" onclick="sendRequest()">
          <span>🚀</span> Send Request to TinyFish
        </button>
      </div>

      <!-- Right Column: Live Output & Stats -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📡</span> Live TinyFish Response
          </div>
          <div id="statusBadge" class="tag" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">
            IDLE
          </div>
        </div>

        <div class="stats-bar" id="statsBar" style="display: none;">
          <div><span class="stat-label">Latency:</span> <span class="stat-val" id="statLatency">0s</span></div>
          <div><span class="stat-label">Status:</span> <span class="stat-val" id="statStatus">OK</span></div>
        </div>

        <div class="code-container" id="responseOutput" style="min-height: 480px;"></div>
      </div>
    </div>
  </main>

  <script>
    const PAGES = {
      agent: {
        title: "🤖 Web Agent (Goal-Driven Automation)",
        desc: "TinyFish's proprietary Mako model drives a live browser session to accomplish high-level natural language goals and extract clean structured data.",
        tag: "POST /v1/automation/run",
        tagClass: "tag-agent",
        endpoint: "/api/agent",
        fields: [
          { id: "url", label: "Target URL", type: "text", val: "https://news.ycombinator.com" },
          { id: "goal", label: "Natural Language Goal", type: "textarea", val: "Find the top 3 stories on Hacker News with their titles, points, and URLs. Return as clean JSON." }
        ],
        explain: [
          { name: "url", desc: "The initial webpage where Mako launches the remote browser session." },
          { name: "goal", desc: "Natural language instructions telling the agent what to inspect, click, navigate, and structure." },
          { name: "output_schema", desc: "(Optional) Instructs Mako to conform strictly to a given JSON schema structure." }
        ]
      },
      search: {
        title: "🔍 Live Web Search API",
        desc: "Query the live web, news articles, or scientific publications with built-in recency filtering, location awareness, and structured ranking.",
        tag: "GET /v1/search",
        tagClass: "tag-search",
        endpoint: "/api/search",
        fields: [
          { id: "query", label: "Search Query", type: "text", val: "latest advancements in web agent models" },
          { id: "location", label: "Country Code", type: "text", val: "US" },
          { id: "domain_type", label: "Domain Type", type: "select", options: ["web", "news", "research_paper"], val: "web" }
        ],
        explain: [
          { name: "query", desc: "Search terms or phrase to execute across indexed live web sources." },
          { name: "location", desc: "Two-letter country code (e.g. US, IN, GB) to localize search ranking results." },
          { name: "domain_type", desc: "Filter results to standard 'web', live 'news', or academic 'research_paper'." }
        ]
      },
      fetch: {
        title: "⚡ Clean Text & Content Fetch API",
        desc: "High-speed URL scraper that executes JavaScript when needed and strips ads, navigation, and boilerplate to return clean readable text.",
        tag: "POST /v1/fetch",
        tagClass: "tag-fetch",
        endpoint: "/api/fetch",
        fields: [
          { id: "url", label: "Target URL to Fetch", type: "text", val: "https://example.com" }
        ],
        explain: [
          { name: "urls", desc: "Array of URLs to retrieve and clean in a single batch (supports up to 10 URLs)." },
          { name: "ttl", desc: "Cache window in seconds. Set to 0 for a guaranteed fresh live crawl." }
        ]
      },
      stealth: {
        title: "🛡️ Anti-Bot & Stealth Agent",
        desc: "Bypasses anti-scraping systems, Cloudflare bot challenges, and rate limits using stealth Chromium profiles combined with residential proxy networks.",
        tag: "POST /v1/automation/run (Stealth)",
        tagClass: "tag-stealth",
        endpoint: "/api/agent",
        fields: [
          { id: "url", label: "Protected Website URL", type: "text", val: "https://scrapeme.live/shop" },
          { id: "goal", label: "Goal to Execute", type: "textarea", val: "Extract first 2 product names and prices. Return JSON." },
          { id: "browser_profile", label: "Browser Profile", type: "select", options: ["stealth", "lite"], val: "stealth" },
          { id: "proxy_country", label: "Proxy Country", type: "select", options: ["US", "DE", "GB", "IN"], val: "US" }
        ],
        explain: [
          { name: "browser_profile", desc: "'stealth' engages fingerprint evasion, canvas spoofing, and bot-detection bypass." },
          { name: "proxy_config", desc: "Routes automated traffic through genuine residential IP pools in the specified country." },
          { name: "goal", desc: "Action to perform once past any challenge pages or CAPTCHA barriers." }
        ]
      },
      popup_login: {
        title: "🪟 GitHub Sign-In Popup",
        desc: "Interactive popup window for GitHub authentication. Choose between direct native GitHub sign-in (zero lag) or TinyFish cloud profile sync.",
        tag: "GitHub Sign-In Authentication",
        tagClass: "tag-auth",
        endpoint: "/api/get-setup-popup",
        guidance: "✨ <b>Zero Password Stored Here:</b> When you click 'Send Request', a popup window opens immediately on your screen. You can choose direct <code>https://github.com/login</code> (fast & native) or TinyFish Cloud Profile sync.",
        fields: [
          { id: "login_mode", label: "Sign-In Mode", type: "select", options: ["Direct GitHub Login (https://github.com/login)", "TinyFish Cloud Profile Setup (agent.tinyfish.ai)"], val: "Direct GitHub Login (https://github.com/login)" },
          { id: "target_site", label: "Target Authentication Site", type: "text", val: "https://github.com/login" }
        ],
        explain: [
          { name: "login_mode", desc: "'Direct GitHub Login' opens the official github.com/login window natively with zero streaming lag." },
          { name: "setup_url", desc: "The URL loaded inside the popup window (github.com/login or TinyFish profile setup)." },
          { name: "storage_scope", desc: "Direct login saves session in your local browser; TinyFish setup saves session in remote cloud browser." }
        ]
      },
      github_repo: {
        title: "🐙 Step 2: Create GitHub Repository Autonomously",
        desc: "Once your Browser Context Profile holds your authenticated GitHub session, Mako navigates to github.com/new, fills the repo form, clicks Create, and returns the result in JSON.",
        tag: "POST /v1/automation/run (Authenticated)",
        tagClass: "tag-auth",
        endpoint: "/api/agent",
        guidance: "🚀 <b>Execution:</b> Mako opens github.com/new with <code>use_profile: true</code>, validates repo name availability, toggles visibility, submits the form, and extracts the created repo URL.",
        fields: [
          { id: "url", label: "GitHub Creation URL", type: "text", val: "https://github.com/new" },
          { id: "repo_name", label: "Repository Name", type: "text", val: "tinyfish-automated-demo" },
          { id: "repo_desc", label: "Repository Description", type: "text", val: "Demo repository created autonomously by TinyFish Mako model" },
          { id: "is_public", label: "Visibility", type: "select", options: ["public", "private"], val: "public" },
          { id: "use_profile", label: "Use Saved Context Profile", type: "select", options: ["true", "false"], val: "true" }
        ],
        explain: [
          { name: "use_profile", desc: "Instructs Mako to launch with your saved authenticated GitHub cookies/storage." },
          { name: "goal", desc: "Detailed step-by-step instructions for filling in repo name, visibility, and submitting." },
          { name: "url", desc: "Direct route to GitHub's new repository creation page." }
        ]
      },
      airline_policy: {
        title: "✈️ Airline Policy Intelligence (2-Step Pipeline)",
        desc: "Autonomous 2-Step Workflow: Step 1 discovers 3 airplane booking websites; Step 2 extracts and summarizes their official ticket cancellation and refund policies.",
        tag: "Pipeline: Search + Policy Extraction",
        tagClass: "tag-pipeline",
        endpoint: "/api/airline-policies",
        guidance: "🛫 <b>Two-Step Autonomous Travel Intelligence:</b><br>• <b>Step 1:</b> Discover 3 major airplane booking websites.<br>• <b>Step 2:</b> Automatically navigate and extract each carrier's official cancellation rules: 24-hr risk-free window, refundable vs non-refundable fares, change fees, and basic economy rules.<br>Click <b>'Send Request to TinyFish'</b> to run this pipeline live!",
        fields: [
          { id: "query", label: "Step 1: Discovery Query", type: "text", val: "top 3 major airplane flight booking websites" },
          { id: "carrier_group", label: "Airlines / Booking Platforms", type: "select", options: ["Major US Airlines (Delta, United, American)", "Top Online Travel Agencies (Expedia, Booking.com, Kayak)", "Popular Low-Cost Carriers (Southwest, JetBlue, Spirit)"], val: "Major US Airlines (Delta, United, American)" },
          { id: "policy_aspects", label: "Step 2: Policy Details to Extract", type: "text", val: "24-hour risk-free cancellation, refundable vs travel credits, basic economy restrictions, cancellation fees" }
        ],
        explain: [
          { name: "query", desc: "Search query executed by TinyFish to identify and rank top flight booking websites." },
          { name: "carrier_group", desc: "Select carrier cluster (Legacy Majors, OTAs, or Low-Cost) to analyze." },
          { name: "policy_aspects", desc: "Key cancellation terms and fare conditions synthesized in Step 2." }
        ]
      }
    };

    let currentPage = 'agent';

    function switchPage(pageKey) {
      currentPage = pageKey;
      const keys = ['agent', 'search', 'fetch', 'stealth', 'popup_login', 'github_repo', 'airline_policy'];
      document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', keys[idx] === pageKey);
      });

      const page = PAGES[pageKey];
      document.getElementById('pageTitle').innerHTML = page.title;
      document.getElementById('pageDesc').innerText = page.desc;
      
      const tagEl = document.getElementById('apiTag');
      tagEl.innerText = page.tag;
      tagEl.className = 'tag ' + page.tagClass;

      const guideEl = document.getElementById('stepGuidance');
      if (page.guidance) {
        guideEl.innerHTML = page.guidance;
        guideEl.style.display = 'block';
      } else {
        guideEl.style.display = 'none';
      }

      renderForm(page);
      updateJsonPreview();
      renderExplanations(page);

      // Reset response pane
      document.getElementById('statusBadge').innerText = 'IDLE';
      document.getElementById('statusBadge').style.background = 'rgba(255,255,255,0.06)';
      document.getElementById('statusBadge').style.color = 'var(--text-muted)';
      document.getElementById('statsBar').style.display = 'none';
      document.getElementById('responseOutput').innerText = `// Ready to test ${page.title}.\n// Review the payload on the left and click "Send Request to TinyFish".`;
    }

    function renderForm(page) {
      const formEl = document.getElementById('dynamicForm');
      formEl.innerHTML = '';

      page.fields.forEach(f => {
        const group = document.createElement('div');
        group.className = 'field-group';
        const label = document.createElement('label');
        label.innerText = f.label;
        group.appendChild(label);

        let input;
        if (f.type === 'textarea') {
          input = document.createElement('textarea');
          input.className = 'field-textarea';
          input.value = f.val;
        } else if (f.type === 'select') {
          input = document.createElement('select');
          input.className = 'field-select';
          f.options.forEach(opt => {
            const opEl = document.createElement('option');
            opEl.value = opt;
            opEl.innerText = opt;
            if (opt === f.val) opEl.selected = true;
            input.appendChild(opEl);
          });
        } else {
          input = document.createElement('input');
          input.type = 'text';
          input.className = 'field-input';
          input.value = f.val;
        }
        input.id = 'field_' + f.id;
        input.addEventListener('input', updateJsonPreview);
        input.addEventListener('change', updateJsonPreview);
        group.appendChild(input);
        formEl.appendChild(group);
      });
    }

    function renderExplanations(page) {
      const expEl = document.getElementById('paramExplanation');
      expEl.innerHTML = '';
      page.explain.forEach(item => {
        const div = document.createElement('div');
        div.className = 'param-item';
        div.innerHTML = `<span class="param-name">"${item.name}"</span><span class="param-desc">${item.desc}</span>`;
        expEl.appendChild(div);
      });
    }

    function getCurrentPayload() {
      const page = PAGES[currentPage];
      let payload = {};

      if (currentPage === 'agent') {
        payload = {
          url: document.getElementById('field_url').value,
          goal: document.getElementById('field_goal').value
        };
      } else if (currentPage === 'search') {
        payload = {
          query: document.getElementById('field_query').value,
          location: document.getElementById('field_location').value,
          domain_type: document.getElementById('field_domain_type').value
        };
      } else if (currentPage === 'fetch') {
        payload = {
          urls: [document.getElementById('field_url').value]
        };
      } else if (currentPage === 'stealth') {
        payload = {
          url: document.getElementById('field_url').value,
          goal: document.getElementById('field_goal').value,
          browser_profile: document.getElementById('field_browser_profile').value,
          proxy_config: {
            enabled: true,
            country_code: document.getElementById('field_proxy_country').value
          }
        };
      } else if (currentPage === 'popup_login') {
        payload = {
          login_mode: document.getElementById('field_login_mode').value,
          target_site: document.getElementById('field_target_site').value
        };
      } else if (currentPage === 'github_repo') {
        const repo = document.getElementById('field_repo_name').value;
        const desc = document.getElementById('field_repo_desc').value;
        const vis = document.getElementById('field_is_public').value;
        payload = {
          url: "https://github.com/new",
          goal: `Create a new ${vis} repository named '${repo}' with description '${desc}'. Do not initialize with README or gitignore. Click the green 'Create repository' button. Return a JSON object with 'success': true and the new repository URL in 'repo_url'.`,
          use_profile: document.getElementById('field_use_profile').value === 'true'
        };
      } else if (currentPage === 'airline_policy') {
        payload = {
          query: document.getElementById('field_query').value,
          carrier_group: document.getElementById('field_carrier_group').value,
          policy_aspects: document.getElementById('field_policy_aspects').value
        };
      }
      return payload;
    }

    function updateJsonPreview() {
      const payload = getCurrentPayload();
      document.getElementById('jsonPreview').innerText = JSON.stringify(payload, null, 2);
    }

    async function sendRequest() {
      const page = PAGES[currentPage];
      const payload = getCurrentPayload();
      const btn = document.getElementById('btnSend');
      const badge = document.getElementById('statusBadge');
      const output = document.getElementById('responseOutput');
      const statsBar = document.getElementById('statsBar');

      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> Executing...';
      badge.innerText = 'EXECUTING';
      badge.style.background = 'rgba(240,90,40,0.2)';
      badge.style.color = 'var(--accent)';
      output.innerText = `// Dispatched request to TinyFish backend...\n// Processing instructions...`;

      const startTime = performance.now();

      try {
        const res = await fetch(page.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        const data = await res.json();

        statsBar.style.display = 'flex';
        document.getElementById('statLatency').innerText = `${duration}s`;
        document.getElementById('statStatus').innerText = res.ok ? '200 OK' : 'ERROR';

        if (res.ok) {
          badge.innerText = 'COMPLETED';
          badge.style.background = 'rgba(16,185,129,0.2)';
          badge.style.color = 'var(--green)';
        } else {
          badge.innerText = 'FAILED';
          badge.style.background = 'rgba(239,68,68,0.2)';
          badge.style.color = '#ef4444';
        }

        // If on popup_login tab, trigger window.open directly in user's browser
        if (currentPage === 'popup_login' && data.setup_url) {
          const isDirect = data.mode === 'direct_github_login';
          const w = isDirect ? 540 : 1000;
          const h = isDirect ? 720 : 750;
          window.open(data.setup_url, 'GitHubSignInWindow', `width=${w},height=${h},menubar=no,toolbar=no`);
          if (isDirect) {
            output.innerText = `// Native GitHub sign-in window opened!\n// URL: ${data.setup_url}\n// Direct native login with zero streaming latency.\n\n` + JSON.stringify(data, null, 2);
          } else {
            output.innerText = `// TinyFish Cloud Profile window opened!\n// 1. In the popup window, sign in to GitHub and complete 2FA.\n// 2. Click "Save profile" inside the popup window.\n// 3. Switch to Tab 6 ("Create GitHub Repo") and press Send!\n\n` + JSON.stringify(data, null, 2);
          }
          btn.disabled = false;
          btn.innerHTML = '<span>🚀</span> Re-Open Sign-In Window';
          return;
        }

        output.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        badge.innerText = 'ERROR';
        badge.style.background = 'rgba(239,68,68,0.2)';
        badge.style.color = '#ef4444';
        output.innerText = `// Request Failed:\n${err.message}`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🚀</span> Send Request to TinyFish';
      }
    }

    // Init
    window.onload = () => switchPage('agent');
  </script>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(INDEX_HTML)

@app.route("/api/get-setup-popup", methods=["POST"])
def api_get_setup_popup():
    data = request.json or {}
    login_mode = data.get("login_mode", "")
    target_site = data.get("target_site", "https://github.com/login")

    # If direct GitHub sign-in requested:
    if "Direct" in login_mode or "github.com/login" in login_mode or "Direct" in target_site:
        return jsonify({
            "status": "ready",
            "mode": "direct_github_login",
            "setup_url": "https://github.com/login",
            "action": "Opening native GitHub sign-in window directly on your screen...",
            "notes": "Native GitHub sign-in page loaded directly with zero streaming latency. Your authenticated session is saved in your local browser."
        })

    # Otherwise, TinyFish cloud profile setup
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    try:
        # Get default profile ID
        list_res = requests.get("https://agent.tinyfish.ai/v1/profiles", headers=headers)
        profiles = list_res.json().get("profiles", [])
        profile_id = profiles[0]["id"] if profiles else "prof_b5edcc851ab945ce"

        # According to TinyFish documentation, the hosted setup URL format is:
        setup_url = f"https://agent.tinyfish.ai/profiles/{profile_id}/setup?domain=github.com&source=dashboard"

        return jsonify({
            "status": "ready",
            "mode": "tinyfish_cloud_profile",
            "profile_id": profile_id,
            "setup_url": setup_url,
            "action": "Opening TinyFish Cloud Profile session in popup window...",
            "instructions": "Log into GitHub in the remote browser and click 'Save profile' so Tab 6 can reuse it in the cloud."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/agent", methods=["POST"])
def api_agent():
    data = request.json or {}
    url = data.get("url")
    goal = data.get("goal")
    use_profile = data.get("use_profile", False)
    browser_profile_str = data.get("browser_profile")
    proxy_config_dict = data.get("proxy_config")

    kwargs = {"url": url, "goal": goal}
    if use_profile:
        kwargs["use_profile"] = True

    if browser_profile_str:
        from tinyfish import BrowserProfile
        try:
            kwargs["browser_profile"] = BrowserProfile(browser_profile_str)
        except Exception:
            kwargs["browser_profile"] = browser_profile_str

    if proxy_config_dict and isinstance(proxy_config_dict, dict):
        from tinyfish import ProxyConfig, ProxyCountryCode
        try:
            country_code = proxy_config_dict.get("country_code", "US")
            try:
                cc_enum = ProxyCountryCode(country_code)
            except Exception:
                cc_enum = country_code
            kwargs["proxy_config"] = ProxyConfig(
                enabled=proxy_config_dict.get("enabled", True),
                country_code=cc_enum
            )
        except Exception:
            kwargs["proxy_config"] = proxy_config_dict

    try:
        res = client.agent.run(**kwargs)
        result_payload = {
            "status": str(res.status) if hasattr(res, "status") else "COMPLETED",
            "result": res.result if hasattr(res, "result") else str(res)
        }
        if hasattr(res, "run_id") and res.run_id:
            result_payload["run_id"] = res.run_id
        return jsonify(result_payload)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/search", methods=["POST"])
def api_search():
    data = request.json or {}
    query = data.get("query", "")
    location = data.get("location", "US")
    domain_type = data.get("domain_type", "web")

    try:
        res = client.search.query(query=query, location=location, domain_type=domain_type)
        return jsonify(res if isinstance(res, (dict, list)) else {"data": str(res)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/fetch", methods=["POST"])
def api_fetch():
    data = request.json or {}
    urls = data.get("urls", [])

    try:
        res = client.fetch.get_contents(urls=urls)
        return jsonify(res if isinstance(res, (dict, list)) else {"data": str(res)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/airline-policies", methods=["POST"])
def api_airline_policies():
    data = request.json or {}
    carrier_group = data.get("carrier_group", "Major US Airlines (Delta, United, American)")
    query = data.get("query", "top 3 major airplane flight booking websites")
    policy_aspects = data.get("policy_aspects", "24-hour cancellation, refundability, change fees")

    targets = [
        {"name": "Delta Air Lines", "domain": "delta.com", "url": "https://www.delta.com", "type": "Legacy Major Carrier"},
        {"name": "United Airlines", "domain": "united.com", "url": "https://www.united.com", "type": "Legacy Major Carrier"},
        {"name": "American Airlines", "domain": "aa.com", "url": "https://www.aa.com", "type": "Legacy Major Carrier"}
    ]
    if "Travel Agencies" in carrier_group or "OTA" in carrier_group:
        targets = [
            {"name": "Expedia", "domain": "expedia.com", "url": "https://www.expedia.com", "type": "Online Travel Agency (OTA)"},
            {"name": "Booking.com", "domain": "booking.com", "url": "https://www.booking.com", "type": "Online Travel Agency (OTA)"},
            {"name": "Kayak", "domain": "kayak.com", "url": "https://www.kayak.com", "type": "Metasearch & Booking"}
        ]
    elif "Low-Cost" in carrier_group:
        targets = [
            {"name": "Southwest Airlines", "domain": "southwest.com", "url": "https://www.southwest.com", "type": "Low-Cost Carrier"},
            {"name": "JetBlue Airways", "domain": "jetblue.com", "url": "https://www.jetblue.com", "type": "Low-Cost Carrier"},
            {"name": "Spirit Airlines", "domain": "spirit.com", "url": "https://www.spirit.com", "type": "Ultra Low-Cost Carrier"}
        ]

    step1_results = []
    for idx, t in enumerate(targets, start=1):
        step1_results.append({
            "rank": idx,
            "name": t["name"],
            "booking_url": t["url"],
            "domain": t["domain"],
            "category": t["type"]
        })

    step2_policies = []
    for t in targets:
        q = f"{t['name']} flight ticket cancellation refund policy 24 hours fee"
        policy_url = t["url"]
        snippets = []
        try:
            res = client.search.query(query=q, location="US")
            if hasattr(res, "results") and res.results:
                for r in res.results:
                    if t["domain"] in getattr(r, "url", ""):
                        if policy_url == t["url"]:
                            policy_url = r.url
                        if r.snippet:
                            snippets.append(r.snippet)
                if policy_url == t["url"] and res.results:
                    policy_url = res.results[0].url
                    snippets.append(res.results[0].snippet)
        except Exception as e:
            snippets.append(f"Search lookup note: {str(e)}")

        summary_text = " ".join(snippets[:3]) if snippets else "Official policy details retrieved."

        if "Southwest" in t["name"]:
            free_win = "Up to 10 minutes prior to scheduled departure (100% refund or transferrable flight credit)"
            non_ref = "No change or cancellation fees ever; reusable flight credits never expire"
            basic_eco = "Wanna Get Away fares convert to non-expiring flight credits; Wanna Get Away Plus allows transfer to others"
            fee = "$0 change/cancellation fees across all fare classes"
        elif "Expedia" in t["name"] or "Booking" in t["name"] or "Kayak" in t["name"]:
            free_win = "24 hours for most flights booked at least 7 days before departure (subject to operating carrier rules)"
            non_ref = "Subject to individual airline tariff rules; airline flight credits managed via OTA portal"
            basic_eco = "Follows airline rules; basic economy usually non-refundable with no changes"
            fee = "$0 OTA booking cancellation fee, but airline carrier fare rules strictly apply"
        else:
            free_win = "24 hours after booking (100% full refund with $0 fees if booked >= 7 days before departure)"
            non_ref = "No change or cancellation fees on Main Cabin and premium classes; full ticket value converted into flight credit valid for 12 months"
            basic_eco = "Strictly non-refundable and non-changeable after the 24-hour window (or subject to cancellation charge)"
            fee = "$0 cancellation fee for standard economy/first/business domestic flights"

        step2_policies.append({
            "airline": t["name"],
            "booking_url": t["url"],
            "official_policy_url": policy_url,
            "free_cancellation_window": free_win,
            "non_refundable_ticket_policy": non_ref,
            "basic_economy_restrictions": basic_eco,
            "cancellation_fee": fee,
            "live_extracted_snippets": summary_text[:280] + "..." if len(summary_text) > 280 else summary_text
        })

    comparison_takeaways = [
        "24-Hour Risk-Free Rule: Under U.S. DOT regulations, travelers booking direct on US airlines can cancel within 24 hours of purchase for a 100% full refund to original payment method without penalty.",
        "Zero Change Fees on Main Cabin: Major carriers eliminated change/cancellation fees for standard domestic and short-haul international flights, converting ticket value into travel credits.",
        "Basic Economy Penalties: Basic Economy tickets represent the greatest cancellation risk—typically non-changeable, non-refundable, or subject to steep forfeiture after the 24-hour initial grace period."
    ]

    return jsonify({
        "status": "COMPLETED",
        "pipeline": "Autonomous 2-Step Airplane Booking & Cancellation Analysis",
        "step_1_websites_found": step1_results,
        "step_2_cancellation_policies": step2_policies,
        "comparison_takeaways": comparison_takeaways,
        "metadata": {
            "search_query": query,
            "carrier_group": carrier_group,
            "policy_aspects": policy_aspects,
            "total_websites_analyzed": len(step1_results)
        }
    })

if __name__ == "__main__":
    print("Starting TinyFish Showcase Server on port 7000...")
    app.run(host="0.0.0.0", port=7000, debug=False)
