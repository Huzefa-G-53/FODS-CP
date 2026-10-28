/**
 * PathForge Frontend Application Controller
 * Minimal, clean client router, API synchronization, roadmap UI state manager,
 * and AI Onboarding Assessment.
 */

(function () {
  'use strict';

  // --- 11-Question Onboarding Assessment Schema ---
  const ASSESSMENT_QUESTIONS = [
    {
      id: "current_status",
      category: "Section 1: Background",
      question: "What best describes your current status?",
      description: "Helps calibrate academic pacing vs. workplace application context.",
      type: "single",
      options: [
        { value: "Undergraduate / College student", label: "Undergraduate / College Student", icon: "🎓" },
        { value: "Working professional (Tech)", label: "Working Professional (Technical)", icon: "💻" },
        { value: "Career switcher (Non-tech)", label: "Career Switcher (Non-tech to Tech)", icon: "🔄" },
        { value: "Self-taught learner", label: "Self-Taught Independent Learner", icon: "📚" },
        { value: "High school / Diploma student", label: "High School / Diploma Student", icon: "🎒" }
      ],
      required: true
    },
    {
      id: "programming_maturity",
      category: "Section 1: Background",
      question: "What is your programming proficiency?",
      description: "Reflects what you can build independently right now.",
      type: "single",
      options: [
        { value: "Absolute beginner", label: "Absolute Beginner", subtext: "Never written code or just started today." },
        { value: "Syntax beginner", label: "Syntax Beginner", subtext: "Know variables, loops, & simple functions." },
        { value: "Competent builder", label: "Competent Builder", subtext: "Can build scripts and integrate APIs." },
        { value: "Experienced developer", label: "Experienced Developer", subtext: "Comfortable building multi-tier applications." }
      ],
      required: true
    },
    {
      id: "known_languages",
      category: "Section 2: Technical Baseline",
      question: "Which languages or technologies have you used before?",
      description: "Select all that apply. If starting fresh, select 'None'.",
      type: "multi",
      options: [
        { value: "Python", label: "Python" },
        { value: "JavaScript / TypeScript", label: "JavaScript / TypeScript" },
        { value: "Java", label: "Java" },
        { value: "C / C++", label: "C / C++" },
        { value: "HTML / CSS", label: "HTML / CSS" },
        { value: "SQL", label: "SQL / Databases" },
        { value: "Go / Rust", label: "Go or Rust" },
        { value: "None", label: "None / First time" }
      ],
      required: true
    },
    {
      id: "dsa_level",
      category: "Section 2: Technical Baseline",
      question: "What is your comfort level with Data Structures & Algorithms (DSA)?",
      description: "Helps prevent placement into overly advanced course tracks.",
      type: "single",
      options: [
        { value: "None", label: "No DSA experience yet", subtext: "Have not worked with linked lists, trees, or Big-O." },
        { value: "Basic", label: "Basic structures", subtext: "Arrays, hash maps, simple sorting." },
        { value: "Intermediate", label: "Intermediate problem solving", subtext: "Trees, graphs, recursion, LeetCode Easy/Medium." },
        { value: "Advanced", label: "Strong competitive level", subtext: "System optimization and complex algorithms." }
      ],
      required: true
    },
    {
      id: "hardware_tier",
      category: "Section 2: Technical Baseline",
      question: "What hardware will you use for learning?",
      description: "Ensures projects fit your machine capabilities.",
      type: "single",
      options: [
        { value: "Standard laptop (4-8GB RAM, no GPU)", label: "Standard / Low-spec Laptop", subtext: "Web dev, scripting, backend." },
        { value: "Mid-tier machine (16GB RAM, modern CPU)", label: "Mid-tier PC / Mac", subtext: "Containers, IDEs, moderate workloads." },
        { value: "Workstation (High-end GPU / Apple Silicon)", label: "High-spec GPU or M-Series Mac", subtext: "Local AI model training, heavy tools." }
      ],
      required: true
    },
    {
      id: "target_role",
      category: "Section 3: Target & Interests",
      question: "What primary role or specialisation are you aiming for?",
      description: "Select your destination career path.",
      type: "single",
      options: [
        { value: "Full-Stack Web Developer", label: "Full-Stack Web Developer", icon: "🌐" },
        { value: "Backend & Systems Engineer", label: "Backend Developer", icon: "⚙️" },
        { value: "AI & Machine Learning Engineer", label: "AI & Machine Learning Engineer", icon: "🤖" },
        { value: "Mobile App Developer (iOS/Android)", label: "Mobile App Developer (iOS / Android)", icon: "📱" },
        { value: "Cybersecurity Specialist", label: "Cybersecurity Specialist", icon: "🔒" },
        { value: "Game Developer", label: "Game Developer (Unity/Unreal)", icon: "🎮" },
        { value: "Data Structures & Algorithms", label: "Data Structures & Algorithms Foundations", icon: "💡" },
        { value: "Undecided / Strong Foundation First", label: "General Programming Foundation", icon: "🧭" }
      ],
      required: true
    },
    {
      id: "project_preference",
      category: "Section 3: Target & Interests",
      question: "What kind of deliverables keep you most motivated?",
      description: "Building what excites you ensures long-term consistency.",
      type: "single",
      options: [
        { value: "Visual interactive web apps & SaaS products", label: "Interactive Web Apps & SaaS Products" },
        { value: "Robust APIs, microservices, and databases", label: "APIs, Databases & Backend Systems" },
        { value: "AI-driven apps, predictive models, & pipelines", label: "AI Applications & Data Pipelines" },
        { value: "Tools, CLIs, and automated utility scripts", label: "Developer Tools & Scripts" }
      ],
      required: true
    },
    {
      id: "primary_goal",
      category: "Section 4: Goals & Constraints",
      question: "What is your immediate goal right now?",
      description: "Governs portfolio project depth and hiring focus.",
      type: "single",
      options: [
        { value: "Land an internship or junior developer job", label: "Land an Internship or Junior Job" },
        { value: "Build & launch my own startup / SaaS idea", label: "Build & Ship My Own Product" },
        { value: "Pass university courses & placements", label: "Ace University Exams & Campus Placements" },
        { value: "Upskill for personal curiosity & career switch", label: "Upskill & Explore at my own pace" }
      ],
      required: true
    },
    {
      id: "weekly_hours",
      category: "Section 4: Goals & Constraints",
      question: "How many hours can you realistically commit each week?",
      description: "Be conservative. Consistent progress beats burnout.",
      type: "single",
      options: [
        { value: "3-5 hours/week", label: "3–5 hours / week", subtext: "Light, steady pace." },
        { value: "6-10 hours/week", label: "6–10 hours / week", subtext: "Standard recommended pace." },
        { value: "12-20 hours/week", label: "12–20 hours / week", subtext: "Accelerated commitment." },
        { value: "25+ hours/week", label: "25+ hours / week (Full-time)", subtext: "Deep immersion." }
      ],
      required: true
    },
    {
      id: "target_timeline",
      category: "Section 4: Goals & Constraints",
      question: "What is your target timeframe to be project-ready?",
      description: "Used to compute roadmap duration.",
      type: "single",
      options: [
        { value: "Under 3 months (Intensive)", label: "Under 3 months" },
        { value: "3-6 months (Recommended)", label: "3–6 months" },
        { value: "6-12 months (Comprehensive)", label: "6–12 months" },
        { value: "Flexible / No strict deadline", label: "Flexible timeline" }
      ],
      required: true
    },
    {
      id: "learning_style",
      category: "Section 5: Pedagogy & Preferences",
      question: "How do you prefer to absorb concepts?",
      description: "Select up to 2 styles.",
      type: "multi",
      max: 2,
      options: [
        { value: "Hands-on project building", label: "Hands-on project building" },
        { value: "Structured step-by-step guides", label: "Step-by-step guides & documentation" },
        { value: "Interactive coding challenges", label: "Interactive drills & exercises" }
      ],
      required: true
    }
  ];

  // --- State Store ---
  const state = {
    roadmaps: [],
    topics: [],
    topicMap: new Map(),
    roadmapMap: new Map(),
    progress: {},
    stats: {},
    currentRoute: '',
    assessmentStep: 0,
    assessmentAnswers: {},
    geminiApiKey: '',
    roadmapViewMode: 'flowchart', // 'flowchart' | 'outline'
    roadmapZoom: 1.0,
    roadmapSearchQuery: '',
    activeTopicId: null,
    dashboardFilter: 'all',
    dashboardSearch: ''
  };

  // --- API Client ---
  const api = {
    async get(endpoint) {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
      return res.json();
    },
    async post(endpoint, data) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
      return res.json();
    },
    async delete(endpoint) {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
      return res.json();
    }
  };

  // --- Notification Toast Hub ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Initial Data Preloading ---
  async function preloadAppData() {
    try {
      const [roadmapsData, topicsData, statsData, progressData, configData] = await Promise.all([
        api.get('/api/roadmaps'),
        api.get('/api/topics'),
        api.get('/api/stats'),
        api.get('/api/progress'),
        api.get('/api/config').catch(() => ({}))
      ]);

      if (configData && configData.geminiApiKey) {
        state.geminiApiKey = configData.geminiApiKey;
      }

      state.roadmaps = roadmapsData;
      state.topics = topicsData;
      state.stats = statsData;
      state.progress = progressData.topics || {};

      state.topicMap.clear();
      topicsData.forEach(t => state.topicMap.set(t.id, t));

      state.roadmapMap.clear();
      roadmapsData.forEach(r => state.roadmapMap.set(r.id, r));

      populateRoadmapsDropdown();
      updateGlobalProgress();
      populatePathfinderSelects();
    } catch (err) {
      console.error('Data preload failed:', err);
      showToast('Could not load data from server.', 'error');
    }
  }

  function populateRoadmapsDropdown() {
    const menu = document.getElementById('roadmaps-menu-list');
    if (!menu) return;

    const careers = state.roadmaps.filter(r => r.type === 'profession');
    const languages = state.roadmaps.filter(r => r.type === 'language');
    const subroadmaps = state.roadmaps.filter(r => r.type === 'subroadmap' || r.type === 'skill');

    let html = '';
    if (careers.length > 0) {
      html += `<div class="dropdown-group-title">Role-Based Roadmaps (${careers.length})</div>`;
      careers.forEach(r => {
        html += `<a href="#/roadmap/${r.id}" class="dropdown-item"><span class="dot dot-backend"></span> ${escapeHtml(r.title)}</a>`;
      });
    }
    if (languages.length > 0) {
      html += `<div class="dropdown-group-title">Languages (${languages.length})</div>`;
      languages.forEach(r => {
        html += `<a href="#/roadmap/${r.id}" class="dropdown-item"><span class="dot dot-c"></span> ${escapeHtml(r.title)}</a>`;
      });
    }
    if (subroadmaps.length > 0) {
      html += `<div class="dropdown-group-title">Skill & Sub-Roadmaps (${subroadmaps.length})</div>`;
      subroadmaps.forEach(r => {
        html += `<a href="#/roadmap/${r.id}" class="dropdown-item"><span class="dot dot-dsa"></span> ${escapeHtml(r.title)}</a>`;
      });
    }

    menu.innerHTML = html;
  }

  function updateGlobalProgress() {
    let completed = 0;
    state.topics.forEach(t => {
      if (t.status === 'Completed') completed++;
    });

    const total = state.topics.length || 1;
    const pct = Math.round((completed / total) * 100);

    const progressText = document.getElementById('global-progress-text');
    const circle = document.getElementById('global-progress-circle');

    if (progressText) {
      progressText.textContent = `${pct}% Done`;
    }

    if (circle) {
      const circumference = 2 * Math.PI * 8;
      const offset = circumference - (pct / 100) * circumference;
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = `${offset}`;
    }
  }

  // --- Router & View Management ---
  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
  }

  function handleRoute() {
    const rawHash = window.location.hash.slice(1) || '/';
    state.currentRoute = rawHash;

    const main = document.getElementById('app-view');
    if (!main) return;

    window.scrollTo(0, 0);
    updateBreadcrumbs(rawHash);

    if (rawHash === '/' || rawHash === '') {
      renderDashboardView(main);
    } else if (rawHash === '/assessment') {
      renderAssessmentView(main);
    } else if (rawHash.startsWith('/roadmap/')) {
      const roadmapId = rawHash.replace('/roadmap/', '');
      renderRoadmapView(main, roadmapId);
    } else if (rawHash.startsWith('/topic/')) {
      const topicId = rawHash.replace('/topic/', '');
      openTopicModal(topicId);
    } else {
      renderDashboardView(main);
    }
  }

  function updateBreadcrumbs(route) {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;

    let crumbs = [{ label: 'Home', link: '#/' }];

    if (route === '/assessment') {
      crumbs.push({ label: 'Roadmap Assessment', link: '#/assessment' });
    } else if (route.startsWith('/roadmap/')) {
      const rmId = route.replace('/roadmap/', '');
      const rm = state.roadmapMap.get(rmId);
      crumbs.push({ label: 'Roadmaps', link: '#/' });
      crumbs.push({ label: rm ? rm.title : rmId, link: `#/roadmap/${rmId}` });
    }

    container.innerHTML = crumbs.map((c, i) => {
      if (i === crumbs.length - 1) {
        return `<span class="crumb-current">${escapeHtml(c.label)}</span>`;
      }
      return `<a href="${c.link}" class="crumb-link">${escapeHtml(c.label)}</a><span class="crumb-sep">/</span>`;
    }).join('');
  }

  // --- View: Dashboard ---
  async function renderDashboardView(container) {
    let recommendations = [];
    try {
      const recRes = await api.get('/api/recommendations');
      recommendations = recRes.recommendations || [];
    } catch (e) {
      console.warn('Could not fetch recommendations:', e);
    }

    let completedCount = 0;
    state.topics.forEach(t => { if (t.status === 'Completed') completedCount++; });

    const totalTopics = state.topics.length || 1;
    const progressPct = Math.round((completedCount / totalTopics) * 100);

    const filter = state.dashboardFilter || 'all';
    const query = (state.dashboardSearch || '').trim().toLowerCase();

    const filteredRoadmaps = state.roadmaps.filter(r => {
      const matchesCategory =
        filter === 'all' ||
        (filter === 'roles' && r.type === 'profession') ||
        (filter === 'languages' && r.type === 'language') ||
        (filter === 'skills' && (r.type === 'subroadmap' || r.type === 'skill'));

      const matchesSearch =
        !query ||
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    let html = `
      <!-- Discovery Hero Header -->
      <section class="discovery-hero">
        <h1 class="discovery-hero-title">Developer Learning Roadmaps</h1>
        <p class="discovery-hero-subtitle">
          Community-driven interactive paths, prerequisite tree graphs, and curriculum modules for 32 modern software roles, languages, and technical disciplines.
        </p>

        <!-- Search Bar -->
        <div class="discovery-search-bar">
          <svg class="discovery-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            class="discovery-search-input"
            id="dashboard-search-input"
            placeholder="Search 32 roadmaps and 237 topics (e.g. DevOps, Rust, AI, C)..."
            value="${escapeHtml(state.dashboardSearch || '')}"
          />
        </div>

        <!-- Category Tabs -->
        <div class="discovery-category-tabs">
          <button class="category-tab-btn ${filter === 'all' ? 'active' : ''}" onclick="PathForge.setDashboardFilter('all')">
            All Tracks (${state.roadmaps.length})
          </button>
          <button class="category-tab-btn ${filter === 'roles' ? 'active' : ''}" onclick="PathForge.setDashboardFilter('roles')">
            Role-Based (${state.roadmaps.filter(r => r.type === 'profession').length})
          </button>
          <button class="category-tab-btn ${filter === 'languages' ? 'active' : ''}" onclick="PathForge.setDashboardFilter('languages')">
            Languages (${state.roadmaps.filter(r => r.type === 'language').length})
          </button>
          <button class="category-tab-btn ${filter === 'skills' ? 'active' : ''}" onclick="PathForge.setDashboardFilter('skills')">
            Skills & Deep Dives (${state.roadmaps.filter(r => r.type === 'subroadmap' || r.type === 'skill').length})
          </button>
        </div>
      </section>

      <!-- Prominent AI Onboarding Assessment Prompt -->
      <section class="assessment-prompt-card mb-8">
        <div class="assessment-prompt-content">
          <div class="assessment-prompt-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <div class="assessment-prompt-text-group">
            <div class="prompt-mini-tag">AI-Assisted Evaluation</div>
            <h3 class="assessment-prompt-title">Unsure where to begin?</h3>
            <p class="assessment-prompt-desc">Take our 2-minute diagnostic onboarding assessment to discover your recommended roadmap matched against all 32 catalog paths.</p>
          </div>
        </div>
        <a href="#/assessment" class="btn btn-primary btn-take-assess">
          <span>Take Assessment</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </section>

      <!-- Recommended Next Topics -->
      ${recommendations.length > 0 ? `
        <section class="dashboard-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Recommended Next Topics</h2>
              <p class="section-desc">Prerequisites fulfilled — ready to study right now</p>
            </div>
          </div>
          <div class="recommendations-grid">
            ${recommendations.slice(0, 4).map(t => `
              <div class="rec-topic-card" onclick="PathForge.openTopicModal('${t.id}')">
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span class="badge">${escapeHtml(t.roadmapId.toUpperCase())}</span>
                    <span class="badge badge-difficulty ${t.difficulty.toLowerCase()}">${t.difficulty}</span>
                  </div>
                  <h4 style="font-size:14px; font-weight:600; margin-bottom:4px;">${escapeHtml(t.title)}</h4>
                  <p style="font-size:12px; color:var(--text-secondary);">${escapeHtml(t.summary ? t.summary.slice(0, 80) + '...' : '')}</p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:11px;">
                  <span class="status-pill" data-status="${t.status}">${t.status}</span>
                  <span style="color:var(--accent-blue); font-weight:500;">Inspect Topic →</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Filtered Roadmaps Grid -->
      <section class="dashboard-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">
              ${filter === 'roles' ? 'Role-Based Career Roadmaps' : filter === 'languages' ? 'Language Fundamentals' : filter === 'skills' ? 'Skills & Specialized Modules' : 'All Learning Roadmaps'}
              <span style="font-size:14px; font-weight:500; color:var(--text-muted); margin-left:8px;">(${filteredRoadmaps.length})</span>
            </h2>
            <p class="section-desc">Interactive curriculum flowcharts with prerequisite tree graphs</p>
          </div>
        </div>

        ${filteredRoadmaps.length === 0 ? `
          <div class="path-no-route-card" style="padding:48px 20px;">
            <div class="no-route-icon">🔍</div>
            <div class="no-route-title">No Roadmaps Match Your Query</div>
            <p class="no-route-desc">No tracks found matching "${escapeHtml(query)}". Try a different search term or reset filters.</p>
            <button class="btn btn-outline btn-sm" style="margin-top:14px;" onclick="PathForge.resetDashboardSearch()">Reset Filters</button>
          </div>
        ` : `
          <div class="grid-careers">
            ${filteredRoadmaps.map(r => renderRoadmapCard(r)).join('')}
          </div>
        `}
      </section>
    `;

    container.innerHTML = html;

    // Attach search listener
    const searchInput = document.getElementById('dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.dashboardSearch = e.target.value;
        renderDashboardView(container);
      });
    }
  }

  function renderRoadmapCard(roadmap) {
    let totalTopics = 0;
    let completedTopics = 0;

    const stages = roadmap.sections || roadmap.stages || [];
    stages.forEach(s => {
      if (s.topicIds) {
        s.topicIds.forEach(tid => {
          totalTopics++;
          const t = state.topicMap.get(tid);
          if (t && t.status === 'Completed') completedTopics++;
        });
      }
    });

    const pct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const typeLabel = roadmap.type === 'profession' ? 'Career Track' : roadmap.type === 'language' ? 'Language' : 'Specialized Skill';

    return `
      <div class="career-card" onclick="location.hash='#/roadmap/${roadmap.id}'">
        <div class="card-top">
          <div class="card-icon card-icon-backend" style="background:#0f172a; color:#fbbf24;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="badge" style="text-transform:uppercase; font-size:10px;">${typeLabel}</span>
            <span class="badge badge-difficulty intermediate">${escapeHtml(roadmap.level || 'All Levels')}</span>
          </div>
        </div>
        <h3 class="card-title">${escapeHtml(roadmap.title)}</h3>
        <p class="card-desc">${escapeHtml(roadmap.description)}</p>

        <div class="card-stages-preview">
          ${stages.slice(0, 3).map(s => `<span class="stage-pill">${escapeHtml(s.title)}</span>`).join('')}
          ${stages.length > 3 ? `<span class="stage-pill" style="opacity:0.6;">+${stages.length - 3} more</span>` : ''}
        </div>

        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${pct}%;"></div>
        </div>

        <div class="card-meta-row">
          <span>${completedTopics}/${totalTopics} Topics Completed</span>
          <span style="font-weight:700; color:${pct > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'};">${pct}%</span>
        </div>
      </div>
    `;
  }

  // --- View: Assessment ---
  function renderAssessmentView(container) {
    container.innerHTML = `
      <div class="assessment-container">
        <!-- Assessment Wizard Header -->
        <div class="assessment-wizard-header">
          <div class="assessment-progress-row">
            <span class="assessment-category" id="assess-category">Category</span>
            <span class="assessment-step-count" id="assess-count">Question 1 of 11</span>
          </div>
          <div class="assessment-progress-bar">
            <div class="assessment-progress-fill" id="assess-bar" style="width: 9%;"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="assessment-card" id="assess-card">
          <!-- Dynamically populated by renderAssessmentQuestion() -->
        </div>

        <!-- Assessment Loading View -->
        <div class="assessment-card" id="assess-loading" style="display:none; text-align:center; padding:40px 20px;">
          <div style="font-size:32px; margin-bottom:12px;">⚡</div>
          <h2 style="font-size:18px; font-weight:700; margin-bottom:8px;">Analyzing Your Profile with Gemini AI...</h2>
          <p style="font-size:13px; color:var(--text-secondary);">Evaluating your background, schedule, and goals against PathForge catalog...</p>
        </div>

        <!-- Assessment Result View -->
        <div id="assess-result" style="display:none;">
          <!-- Dynamically populated by synthesizeAssessmentResult() -->
        </div>
      </div>
    `;

    renderAssessmentQuestion();
  }

  function renderAssessmentQuestion() {
    const card = document.getElementById('assess-card');
    if (!card) return;

    const q = ASSESSMENT_QUESTIONS[state.assessmentStep];
    if (!q) return;

    document.getElementById('assess-category').textContent = q.category;
    document.getElementById('assess-count').textContent = `Question ${state.assessmentStep + 1} of ${ASSESSMENT_QUESTIONS.length}`;
    document.getElementById('assess-bar').style.width = `${((state.assessmentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`;

    let optionsHtml = '';
    if (q.type === 'single') {
      optionsHtml = q.options.map(opt => {
        const selected = state.assessmentAnswers[q.id] === opt.value;
        return `
          <div class="assessment-option-btn ${selected ? 'selected' : ''}" onclick="PathForge.selectAssessmentSingle('${q.id}', '${escapeHtml(opt.value)}')">
            <div>
              <div style="font-weight:600; font-size:13.5px;">${opt.icon ? opt.icon + ' ' : ''}${escapeHtml(opt.label)}</div>
              ${opt.subtext ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">${escapeHtml(opt.subtext)}</div>` : ''}
            </div>
            <div class="option-check-circle">${selected ? '✓' : ''}</div>
          </div>
        `;
      }).join('');
    } else if (q.type === 'multi') {
      const selectedArr = state.assessmentAnswers[q.id] || [];
      optionsHtml = q.options.map(opt => {
        const selected = selectedArr.includes(opt.value);
        return `
          <div class="assessment-option-btn ${selected ? 'selected' : ''}" onclick="PathForge.toggleAssessmentMulti('${q.id}', '${escapeHtml(opt.value)}', ${q.max || 99})">
            <div style="font-weight:600; font-size:13.5px;">${escapeHtml(opt.label)}</div>
            <div class="option-check-box">${selected ? '✓' : ''}</div>
          </div>
        `;
      }).join('');
    }

    card.innerHTML = `
      <h2 style="font-size:18px; font-weight:700; margin-bottom:4px;">${escapeHtml(q.question)}</h2>
      <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:20px;">${escapeHtml(q.description)}</p>

      <div class="assessment-options-grid">
        ${optionsHtml}
      </div>

      <div class="assessment-nav-row">
        <button class="btn btn-secondary btn-sm" ${state.assessmentStep === 0 ? 'disabled style="opacity:0.4;"' : ''} onclick="PathForge.prevAssessmentStep()">Back</button>
        <button class="btn btn-primary btn-sm" onclick="PathForge.nextAssessmentStep()">
          ${state.assessmentStep === ASSESSMENT_QUESTIONS.length - 1 ? 'Find My Roadmap' : 'Next'}
        </button>
      </div>
    `;
  }

  function selectAssessmentSingle(qId, value) {
    state.assessmentAnswers[qId] = value;
    renderAssessmentQuestion();
  }

  function toggleAssessmentMulti(qId, value, maxAllowed) {
    let current = state.assessmentAnswers[qId] || [];
    if (value === 'None') {
      current = ['None'];
    } else {
      current = current.filter(item => item !== 'None');
      if (current.includes(value)) {
        current = current.filter(item => item !== value);
      } else {
        if (current.length < maxAllowed) {
          current.push(value);
        } else {
          showToast(`Choose up to ${maxAllowed} options`);
          return;
        }
      }
    }
    state.assessmentAnswers[qId] = current;
    renderAssessmentQuestion();
  }

  function prevAssessmentStep() {
    if (state.assessmentStep > 0) {
      state.assessmentStep--;
      renderAssessmentQuestion();
    }
  }

  function nextAssessmentStep() {
    const q = ASSESSMENT_QUESTIONS[state.assessmentStep];
    const ans = state.assessmentAnswers[q.id];
    if (q.required && (!ans || (Array.isArray(ans) && ans.length === 0))) {
      showToast('Please select an option before proceeding', 'error');
      return;
    }

    if (state.assessmentStep < ASSESSMENT_QUESTIONS.length - 1) {
      state.assessmentStep++;
      renderAssessmentQuestion();
    } else {
      submitAssessment();
    }
  }

  async function callGeminiAPI(answers, availableRoadmaps) {
    const key = state.geminiApiKey;
    if (!key || key.trim() === "") return null;

    const catalogList = availableRoadmaps.map(r => `- ${r.id}: ${r.title} (${r.type})`).join('\n');

    const systemPrompt = `You are PathForge AI Roadmap Evaluator.
Given a user's onboarding assessment answers, determine the single best matching roadmap from our exact catalog:
${catalogList}

RULES:
Choose the single most suitable roadmap ID from the catalog that fits the user's career ambition, target role, and technical baseline.
Respond ONLY with valid JSON:
{ "matched_id": "<one_of_the_exact_catalog_ids_above>" }

If no existing roadmap reasonably aligns with their target role, respond with JSON:
{ "matched_id": null }`;

    const cleanKey = encodeURIComponent(key.trim());
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Answers:\n" + JSON.stringify(answers, null, 2) }] }
            ],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!res.ok) {
          console.warn(`Gemini API call to ${model} returned HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.matched_id) {
            return availableRoadmaps.find(r => r.id === parsed.matched_id) || null;
          } else {
            return 'NO_MATCH';
          }
        }
      } catch (err) {
        console.warn(`Gemini API attempt with ${model} failed:`, err);
      }
    }
    return null;
  }

  async function submitAssessment() {
    const card = document.getElementById('assess-card');
    const loading = document.getElementById('assess-loading');
    const result = document.getElementById('assess-result');

    if (card) card.style.display = 'none';
    if (loading) loading.style.display = 'block';

    const answers = state.assessmentAnswers;
    const targetRole = (answers.target_role || '').toLowerCase();
    const knownLangs = answers.known_languages || [];
    const dsaLevel = answers.dsa_level || 'None';

    const availableRoadmaps = state.roadmaps.length > 0 ? state.roadmaps : [
      { id: 'ai-ml-engineer', title: 'AI & ML Engineer', type: 'profession' },
      { id: 'backend-developer', title: 'Backend Systems Developer', type: 'profession' },
      { id: 'fullstack-developer', title: 'Full-Stack Web Developer', type: 'profession' },
      { id: 'c', title: 'C Programming Language', type: 'language' },
      { id: 'java', title: 'Java Platform Engineering', type: 'language' },
      { id: 'python', title: 'Python Development', type: 'language' },
      { id: 'dsa', title: 'Data Structures & Algorithms', type: 'subroadmap' }
    ];

    let matchedRoadmap = await callGeminiAPI(answers, availableRoadmaps);

    if (matchedRoadmap === null) {
      // Robust fuzzy match against the full 32 catalog
      if (targetRole.includes('full-stack') || targetRole.includes('web developer')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'fullstack-developer' || r.id === 'frontend-developer');
      } else if (targetRole.includes('backend') || targetRole.includes('systems')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'backend-developer' || r.id === 'backend-development');
      } else if (targetRole.includes('ai') || targetRole.includes('machine learning')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'ai-ml-engineer' || r.id === 'machine-learning' || r.id === 'data-science');
      } else if (targetRole.includes('mobile')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'android-developer' || r.id === 'ios-developer');
      } else if (targetRole.includes('cybersecurity')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'cybersecurity-analyst' || r.id === 'devsecops-engineer');
      } else if (targetRole.includes('game')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'game-developer' || r.id === 'c');
      } else if (targetRole.includes('data structures') || targetRole.includes('dsa')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'dsa');
      } else if (knownLangs.includes('C / C++') && dsaLevel === 'None') {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'c');
      } else if (knownLangs.includes('Java')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'java');
      } else if (knownLangs.includes('Python')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'python');
      } else {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'fullstack-developer') || availableRoadmaps[0];
      }
    } else if (matchedRoadmap === 'NO_MATCH') {
      matchedRoadmap = null;
    }

    if (loading) loading.style.display = 'none';
    if (result) result.style.display = 'block';

    if (!matchedRoadmap) {
      result.innerHTML = `
        <div class="assessment-no-match-card">
          <div style="font-size:32px; margin-bottom:12px;">🗺️</div>
          <h3 style="font-size:17px; font-weight:700; margin-bottom:8px; color:var(--text-primary);">Roadmap Unavailable</h3>
          <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px; max-width:540px; margin-left:auto; margin-right:auto;">
            we dont have the roadmap you are looking for, we keep adding new roadmaps with every update, if you want this roadmap to be added please click the "request roadmap" button below
          </p>
          <button class="btn btn-primary" onclick="PathForge.requestRoadmapBtnClicked()">Request Roadmap</button>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="assessment-match-card">
          <div class="badge badge-difficulty beginner" style="margin-bottom:8px;">Recommended Roadmap</div>
          <h2 style="font-size:20px; font-weight:800; margin-bottom:8px;">${escapeHtml(matchedRoadmap.title)}</h2>
          <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
            Based on your assessment profile (Target: ${escapeHtml(targetRole || 'Software Engineering')}), this roadmap is your ideal fit.
          </p>
          <a href="#/roadmap/${matchedRoadmap.id}" class="btn btn-primary">Open Recommended Roadmap →</a>
        </div>
      `;
    }
  }

  function requestRoadmapBtnClicked() {
    showToast('Roadmap request submitted! We will add this track in our next update.');
  }

  // --- View: Roadmap Detail (roadmap.sh Flowchart Canvas & Outline) ---
  async function renderRoadmapView(container, roadmapId) {
    container.innerHTML = `<div style="text-align:center; padding:60px 0;"><span style="color:var(--text-muted);">Loading roadmap...</span></div>`;

    try {
      const roadmap = await api.get(`/api/roadmaps/${roadmapId}`);
      let totalTopics = 0;
      let completedTopics = 0;

      const sections = roadmap.sections || roadmap.stages || [];
      sections.forEach(s => {
        if (s.topicIds) {
          s.topicIds.forEach(tid => {
            totalTopics++;
            const t = state.topicMap.get(tid);
            if (t && t.status === 'Completed') completedTopics++;
          });
        }
      });
      const pct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
      const viewMode = state.roadmapViewMode || 'flowchart';
      const zoom = state.roadmapZoom || 1.0;
      const searchQuery = (state.roadmapSearchQuery || '').trim().toLowerCase();

      let html = `
        <!-- Roadmap Hero Banner -->
        <div class="roadmap-hero">
          <div class="roadmap-hero-top">
            <div class="roadmap-hero-left">
              <div class="roadmap-hero-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h1 class="roadmap-hero-title">${escapeHtml(roadmap.title)}</h1>
                <div style="display:flex; gap:8px; align-items:center;">
                  <span class="badge" style="text-transform:uppercase;">${escapeHtml(roadmap.type)}</span>
                  <span class="badge badge-difficulty intermediate">${escapeHtml(roadmap.level || 'All Levels')}</span>
                  <span class="badge">${roadmap.estimatedHours || 40} Hours</span>
                  <span class="badge">${sections.length} Stages</span>
                </div>
              </div>
            </div>

            <!-- Progress Stat -->
            <div style="text-align:right;">
              <span style="font-size:24px; font-weight:800; color:${pct > 0 ? 'var(--accent-emerald)' : 'var(--text-primary)'};">${pct}%</span>
              <div style="font-size:12px; color:var(--text-muted); font-weight:500;">${completedTopics} of ${totalTopics} Completed</div>
            </div>
          </div>

          <p class="roadmap-hero-desc">${escapeHtml(roadmap.description)}</p>

          <div class="card-progress-bar" style="margin-bottom:16px;">
            <div class="card-progress-fill" style="width: ${pct}%;"></div>
          </div>

          <!-- Controls Toolbar -->
          <div class="roadmap-toolbar">
            <div class="toolbar-group">
              <div class="toolbar-search">
                <svg class="toolbar-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  class="toolbar-search-input"
                  id="roadmap-topic-search-input"
                  placeholder="Filter topics on map..."
                  value="${escapeHtml(state.roadmapSearchQuery || '')}"
                />
              </div>

              <!-- Flowchart vs Outline View Toggle -->
              <div class="view-toggle-btn-group">
                <button class="view-toggle-btn ${viewMode === 'flowchart' ? 'active' : ''}" onclick="PathForge.setRoadmapViewMode('flowchart')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>Flowchart</span>
                </button>
                <button class="view-toggle-btn ${viewMode === 'outline' ? 'active' : ''}" onclick="PathForge.setRoadmapViewMode('outline')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  <span>Outline</span>
                </button>
              </div>
            </div>

            <!-- Zoom & Pan Controls (Flowchart mode) -->
            ${viewMode === 'flowchart' ? `
              <div class="toolbar-group">
                <button class="btn btn-outline btn-xs" onclick="PathForge.zoomRoadmap(-0.15)" title="Zoom Out">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <span style="font-size:12px; font-weight:600; min-width:44px; text-align:center; color:var(--text-secondary);">${Math.round(zoom * 100)}%</span>
                <button class="btn btn-outline btn-xs" onclick="PathForge.zoomRoadmap(0.15)" title="Zoom In">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <button class="btn btn-outline btn-xs" onclick="PathForge.resetRoadmapZoom()" title="Fit / Reset Zoom">
                  Fit View
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Flowchart Legend Bar -->
        <div class="roadmap-legend-bar">
          <span style="font-weight:700; color:var(--text-primary);">Legend:</span>
          <div class="legend-item"><span class="legend-chip completed"></span> Completed</div>
          <div class="legend-item"><span class="legend-chip in-progress"></span> In Progress</div>
          <div class="legend-item"><span class="legend-chip familiar"></span> Familiar (Shared Concept)</div>
          <div class="legend-item"><span class="legend-chip not-started"></span> Not Started</div>
          <div class="legend-item"><span class="legend-chip subroadmap"></span> Sub-Roadmap</div>
          <div class="legend-item"><span class="legend-line solid"></span> Prerequisite Dependency</div>
          <div class="legend-item"><span class="legend-line"></span> Stage Ordering</div>
        </div>

        ${viewMode === 'flowchart' ? `
          <!-- Visual Flowchart Canvas Viewport -->
          <div class="flowchart-canvas-wrapper">
            <div class="flowchart-viewport" id="flowchart-viewport">
              <div class="flowchart-canvas" id="flowchart-canvas" style="transform: scale(${zoom});">
                <svg class="flowchart-svg-overlay" id="flowchart-svg-overlay">
                  <defs>
                    <marker id="arrow-prereq" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                    </marker>
                    <marker id="arrow-stage" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                </svg>

                ${sections.map((sec, idx) => `
                  <div class="flowchart-stage" id="stage-${sec.id || idx}">
                    <div class="stage-header-row">
                      <div style="display:flex; align-items:center;">
                        <span class="stage-badge-number">${idx + 1}</span>
                        <span class="stage-title-text">${escapeHtml(sec.title)}</span>
                      </div>
                      <span class="badge" style="font-size:11px;">${(sec.topicIds || []).length} Topics</span>
                    </div>

                    <div class="stage-nodes-cluster">
                      ${(sec.topicIds || []).map(tid => renderFlowchartNode(tid, searchQuery)).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Floating Controls Dock -->
            <div class="flowchart-controls-dock">
              <button class="dock-btn" onclick="PathForge.zoomRoadmap(0.15)" title="Zoom In">+</button>
              <button class="dock-btn" onclick="PathForge.zoomRoadmap(-0.15)" title="Zoom Out">−</button>
              <button class="dock-btn" onclick="PathForge.resetRoadmapZoom()" title="Reset Zoom">⤢</button>
            </div>
          </div>
        ` : `
          <!-- Structured Outline View -->
          <div class="roadmap-outline-view">
            ${sections.map((sec, idx) => `
              <div class="outline-stage-card">
                <div class="outline-stage-title">${idx + 1}. ${escapeHtml(sec.title)}</div>
                <div class="outline-topics-list">
                  ${(sec.topicIds || []).map(tid => renderOutlineTopicRow(tid, searchQuery)).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;

      container.innerHTML = html;

      // Attach search input listener
      const topicSearchInput = document.getElementById('roadmap-topic-search-input');
      if (topicSearchInput) {
        topicSearchInput.addEventListener('input', (e) => {
          state.roadmapSearchQuery = e.target.value;
          renderRoadmapView(container, roadmapId);
        });
      }

      // If in flowchart mode, draw SVG prerequisite arrows and bind drag-to-pan
      if (viewMode === 'flowchart') {
        requestAnimationFrame(() => {
          drawRoadmapConnectors(roadmap);
          initFlowchartPan();
        });
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <h2 style="margin-bottom:8px;">Roadmap not found</h2>
          <p style="color:var(--text-secondary); margin-bottom:16px;">The roadmap '${escapeHtml(roadmapId)}' could not be loaded.</p>
          <a href="#/" class="btn btn-primary">Return to Dashboard</a>
        </div>
      `;
    }
  }

  function renderFlowchartNode(topicId, query) {
    const t = state.topicMap.get(topicId);
    if (!t) return `<div class="roadmap-node-box">Topic ${escapeHtml(topicId)} missing</div>`;

    const status = t.status || 'Not Started';
    const isSubroadmap = t.type === 'subroadmap';
    const isCompleted = status === 'Completed';
    const isInProgress = status === 'In Progress';
    const isFamiliar = status === 'Familiar';

    let statusClass = 'status-not-started';
    let dotColor = '#cbd5e1';
    if (isCompleted) { statusClass = 'status-completed'; dotColor = '#10b981'; }
    else if (isInProgress) { statusClass = 'status-in-progress'; dotColor = '#3b82f6'; }
    else if (isFamiliar) { statusClass = 'status-familiar'; dotColor = '#a855f7'; }

    let searchMatch = false;
    let dimmed = false;
    if (query) {
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchSummary = (t.summary || '').toLowerCase().includes(query);
      if (matchTitle || matchSummary) {
        searchMatch = true;
      } else {
        dimmed = true;
      }
    }

    const isSelected = state.activeTopicId === t.id;

    return `
      <div
        class="roadmap-node-box ${statusClass} ${isSubroadmap ? 'status-subroadmap' : ''} ${isSelected ? 'selected' : ''} ${searchMatch ? 'search-match' : ''} ${dimmed ? 'dimmed' : ''}"
        id="node-${t.id}"
        data-topic-id="${t.id}"
        onclick="PathForge.openTopicDrawer('${t.id}')"
      >
        <div class="node-top-bar">
          <span class="node-status-indicator">
            <span class="node-status-dot" style="background:${dotColor};"></span>
            <span style="font-size:11px;">${status}</span>
          </span>
          <span class="badge badge-difficulty ${t.difficulty.toLowerCase()}" style="font-size:9.5px; padding:1px 5px;">${t.difficulty}</span>
        </div>

        <div class="node-title">${escapeHtml(t.title)}</div>

        <div class="node-subtext">
          <span>${t.estimatedMinutes}m</span>
          ${isSubroadmap ? `<span class="badge" style="color:var(--accent-cyan); font-size:9px;">Sub-Roadmap ↗</span>` : `<span style="color:var(--text-muted); font-size:10px;">${(t.prerequisites || []).length > 0 ? `${t.prerequisites.length} Prereqs` : 'Foundational'}</span>`}
        </div>
      </div>
    `;
  }

  function renderOutlineTopicRow(topicId, query) {
    const t = state.topicMap.get(topicId);
    if (!t) return `<div class="outline-topic-row">Topic ${escapeHtml(topicId)} missing</div>`;

    const status = t.status || 'Not Started';
    const isSubroadmap = t.type === 'subroadmap';

    if (query) {
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchSummary = (t.summary || '').toLowerCase().includes(query);
      if (!matchTitle && !matchSummary) return '';
    }

    return `
      <div class="outline-topic-row" onclick="PathForge.openTopicDrawer('${t.id}')">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="status-pill" data-status="${status}">${status}</span>
          <div>
            <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${escapeHtml(t.title)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(t.summary ? t.summary.slice(0, 90) + '...' : '')}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge badge-difficulty ${t.difficulty.toLowerCase()}">${t.difficulty}</span>
          <span style="font-size:12px; color:var(--text-muted);">${t.estimatedMinutes}m</span>
          ${isSubroadmap ? `<span class="badge" style="color:var(--accent-cyan);">Sub-Roadmap ↗</span>` : `<span style="color:var(--accent-blue); font-size:13px;">View →</span>`}
        </div>
      </div>
    `;
  }

  // --- SVG Connectors Drawing ---
  function drawRoadmapConnectors(roadmap) {
    const svg = document.getElementById('flowchart-svg-overlay');
    const canvas = document.getElementById('flowchart-canvas');
    if (!svg || !canvas) return;

    // Remove existing paths
    const oldPaths = svg.querySelectorAll('.flowchart-arrow');
    oldPaths.forEach(p => p.remove());

    const canvasRect = canvas.getBoundingClientRect();
    const zoom = state.roadmapZoom || 1.0;

    const sections = roadmap.sections || roadmap.stages || [];
    const roadmapTopicIds = new Set();
    sections.forEach(s => (s.topicIds || []).forEach(tid => roadmapTopicIds.add(tid)));

    // For each topic in this roadmap, check its genuine prerequisites
    roadmapTopicIds.forEach(tid => {
      const t = state.topicMap.get(tid);
      if (!t || !t.prerequisites) return;

      const targetEl = document.getElementById(`node-${tid}`);
      if (!targetEl) return;
      const targetRect = targetEl.getBoundingClientRect();

      t.prerequisites.forEach(prereqId => {
        // Only draw connector if the prerequisite is on this roadmap canvas
        if (!roadmapTopicIds.has(prereqId)) return;
        const sourceEl = document.getElementById(`node-${prereqId}`);
        if (!sourceEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();

        // Calculate positions relative to canvas in unscaled coordinates
        const x1 = ((sourceRect.left + sourceRect.width / 2) - canvasRect.left) / zoom;
        const y1 = (sourceRect.bottom - canvasRect.top) / zoom;
        const x2 = ((targetRect.left + targetRect.width / 2) - canvasRect.left) / zoom;
        const y2 = (targetRect.top - canvasRect.top) / zoom;

        // Create cubic Bézier curve for smooth roadmap.sh aesthetic
        const midY = (y1 + y2) / 2;
        const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'flowchart-arrow prerequisite');
        path.setAttribute('marker-end', 'url(#arrow-prereq)');
        svg.appendChild(path);
      });
    });
  }

  // --- Viewport Drag-to-Pan ---
  function initFlowchartPan() {
    const viewport = document.getElementById('flowchart-viewport');
    if (!viewport) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.roadmap-node-box') || e.target.closest('button')) return;
      isDown = true;
      viewport.classList.add('grabbing');
      startX = e.pageX - viewport.offsetLeft;
      startY = e.pageY - viewport.offsetTop;
      scrollLeft = viewport.scrollLeft;
      scrollTop = viewport.scrollTop;
    });

    viewport.addEventListener('mouseleave', () => {
      isDown = false;
      viewport.classList.remove('grabbing');
    });

    viewport.addEventListener('mouseup', () => {
      isDown = false;
      viewport.classList.remove('grabbing');
    });

    viewport.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      viewport.scrollLeft = scrollLeft - walkX;
      viewport.scrollTop = scrollTop - walkY;
    });
  }

  // --- Flowchart View Controls ---
  function setRoadmapViewMode(mode) {
    state.roadmapViewMode = mode;
    if (state.currentRoute.startsWith('/roadmap/')) {
      const rmId = state.currentRoute.replace('/roadmap/', '');
      renderRoadmapView(document.getElementById('app-view'), rmId);
    }
  }

  function zoomRoadmap(delta) {
    const current = state.roadmapZoom || 1.0;
    const next = Math.max(0.6, Math.min(1.6, current + delta));
    state.roadmapZoom = next;
    const canvas = document.getElementById('flowchart-canvas');
    if (canvas) {
      canvas.style.transform = `scale(${next})`;
      if (state.currentRoute.startsWith('/roadmap/')) {
        const rm = state.roadmapMap.get(state.currentRoute.replace('/roadmap/', ''));
        if (rm) drawRoadmapConnectors(rm);
      }
    }
  }

  function resetRoadmapZoom() {
    state.roadmapZoom = 1.0;
    const canvas = document.getElementById('flowchart-canvas');
    if (canvas) {
      canvas.style.transform = `scale(1.0)`;
      if (state.currentRoute.startsWith('/roadmap/')) {
        const rm = state.roadmapMap.get(state.currentRoute.replace('/roadmap/', ''));
        if (rm) drawRoadmapConnectors(rm);
      }
    }
  }

  // --- Topic Drawer Tab Switching ---
  function switchTopicTab(tabId) {
    const tabButtons = document.querySelectorAll('#topic-tabs-bar .modal-tab-btn');
    const tabPanes = document.querySelectorAll('#modal-topic-body .tab-pane');

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    tabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.style.display = 'block';
        pane.classList.add('active');
      } else {
        pane.style.display = 'none';
        pane.classList.remove('active');
      }
    });
  }

  // --- Topic Drawer Controls (roadmap.sh style slide-over drawer) ---
  async function openTopicDrawer(topicId) {
    const drawer = document.getElementById('topic-drawer');
    const backdrop = document.getElementById('topic-drawer-backdrop');
    if (!drawer) return;

    state.activeTopicId = topicId;

    // Update active node styling on map
    document.querySelectorAll('.roadmap-node-box').forEach(b => {
      b.classList.toggle('selected', b.dataset.topicId === topicId);
    });

    // Reset view to primary overview tab
    switchTopicTab('tab-overview');

    try {
      const [topic, dependents] = await Promise.all([
        api.get(`/api/topics/${topicId}`),
        api.get(`/api/topics/${topicId}/dependents`).catch(() => [])
      ]);

      document.getElementById('modal-topic-title').textContent = topic.title;
      document.getElementById('modal-roadmap-badge').textContent = (topic.roadmapId || 'General').toUpperCase();

      const diffBadge = document.getElementById('modal-difficulty-badge');
      diffBadge.textContent = topic.difficulty;
      diffBadge.className = `badge badge-difficulty ${topic.difficulty.toLowerCase()}`;

      document.getElementById('modal-time-badge').textContent = `${topic.estimatedMinutes}m`;
      document.getElementById('modal-explanation-content').textContent = topic.explanation || topic.summary;
      document.getElementById('modal-code-snippet').textContent = topic.codeExample || '// No code example provided';

      // Status buttons
      const statusButtons = document.querySelectorAll('#modal-status-group .status-btn');
      statusButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === topic.status);
        btn.onclick = () => updateTopicStatusFromDrawer(topic.id, btn.dataset.status);
      });

      // Objectives
      const objList = document.getElementById('modal-objectives-list');
      if (objList) {
        objList.innerHTML = (topic.objectives || []).map(o => `<li>${escapeHtml(o)}</li>`).join('');
      }

      // Pitfalls
      const pitList = document.getElementById('modal-pitfalls-list');
      if (pitList) {
        pitList.innerHTML = (topic.commonPitfalls || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
      }

      // Prerequisites
      const prereqsList = document.getElementById('modal-prereqs-list');
      if (prereqsList) {
        if (topic.prerequisites && topic.prerequisites.length > 0) {
          prereqsList.innerHTML = topic.prerequisites.map(pid => {
            const pt = state.topicMap.get(pid);
            const title = pt ? pt.title : pid;
            const status = pt ? pt.status : 'Not Started';
            return `
              <span class="badge" style="cursor:pointer; padding:5px 9px;" onclick="PathForge.openTopicDrawer('${pid}')">
                ${escapeHtml(title)}
                <span class="status-pill" data-status="${status}" style="font-size:9px; padding:1px 4px; margin-left:4px;">${status}</span>
              </span>
            `;
          }).join('');
        } else {
          prereqsList.innerHTML = `<span class="muted-text">None required (Foundational topic)</span>`;
        }
      }

      // Dependents ("Unlocks Next")
      const depSection = document.getElementById('modal-dependents-section');
      const depList = document.getElementById('modal-dependents-list');
      if (depSection && depList) {
        if (dependents && dependents.length > 0) {
          depSection.style.display = 'block';
          depList.innerHTML = dependents.map(did => {
            const dt = state.topicMap.get(did);
            const title = dt ? dt.title : did;
            const status = dt ? dt.status : 'Not Started';
            return `
              <span class="badge" style="cursor:pointer; padding:5px 9px;" onclick="PathForge.openTopicDrawer('${did}')">
                ${escapeHtml(title)}
                <span class="status-pill" data-status="${status}" style="font-size:9px; padding:1px 4px; margin-left:4px;">${status}</span>
              </span>
            `;
          }).join('');
        } else {
          depSection.style.display = 'none';
        }
      }

      // Resources
      const resList = document.getElementById('modal-resources-list');
      if (resList) {
        resList.innerHTML = (topic.resources || []).map(r => `
          <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="resource-card">
            <div style="font-weight:600; margin-bottom:2px;">${escapeHtml(r.title)} ↗</div>
            <span class="badge" style="font-size:10px;">${escapeHtml(r.type)}</span>
          </a>
        `).join('');
      }

      // Subroadmap Callout
      const srCallout = document.getElementById('modal-subroadmap-callout');
      const srBtn = document.getElementById('modal-btn-view-subroadmap');
      if (topic.type === 'subroadmap' && topic.targetSubroadmap) {
        srCallout.style.display = 'flex';
        srBtn.onclick = () => {
          closeTopicDrawer();
          location.hash = `#/roadmap/${topic.targetSubroadmap}`;
        };
      } else {
        srCallout.style.display = 'none';
      }

      // Find Path Here Button
      const findPathBtn = document.getElementById('modal-btn-find-path');
      if (findPathBtn) {
        findPathBtn.onclick = () => {
          closeTopicDrawer();
          openPathfinderModal(null, topic.id);
        };
      }

      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      if (backdrop) {
        backdrop.classList.add('active');
        backdrop.setAttribute('aria-hidden', 'false');
      }
    } catch (err) {
      console.error('Failed to load topic details:', err);
      showToast('Could not load topic details', 'error');
    }
  }

  async function updateTopicStatusFromDrawer(topicId, newStatus) {
    try {
      await api.post('/api/progress', { topicId, status: newStatus });
      await preloadAppData();

      const statusButtons = document.querySelectorAll('#modal-status-group .status-btn');
      statusButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === newStatus);
      });

      showToast(`Status updated: ${newStatus}`);

      // Dynamically update the node on the active flowchart map without destroying scroll/zoom
      const nodeEl = document.getElementById(`node-${topicId}`);
      if (nodeEl) {
        nodeEl.classList.remove('status-completed', 'status-in-progress', 'status-familiar', 'status-not-started');
        let statusClass = 'status-not-started';
        let dotColor = '#cbd5e1';
        if (newStatus === 'Completed') { statusClass = 'status-completed'; dotColor = '#10b981'; }
        else if (newStatus === 'In Progress') { statusClass = 'status-in-progress'; dotColor = '#3b82f6'; }
        else if (newStatus === 'Familiar') { statusClass = 'status-familiar'; dotColor = '#a855f7'; }
        nodeEl.classList.add(statusClass);

        const dot = nodeEl.querySelector('.node-status-dot');
        if (dot) dot.style.background = dotColor;

        const statusLabel = nodeEl.querySelector('.node-status-indicator span:last-child');
        if (statusLabel) statusLabel.textContent = newStatus;
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update progress', 'error');
    }
  }

  function closeTopicDrawer() {
    const drawer = document.getElementById('topic-drawer');
    const backdrop = document.getElementById('topic-drawer-backdrop');
    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    state.activeTopicId = null;
    document.querySelectorAll('.roadmap-node-box.selected').forEach(b => b.classList.remove('selected'));
  }

  // --- Path Finder Modal ---
  function populatePathfinderSelects() {
    const start = document.getElementById('path-start-select');
    const end = document.getElementById('path-end-select');
    if (!start || !end) return;

    const options = state.topics.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${t.roadmapId.toUpperCase()})</option>`).join('');
    start.innerHTML = options;
    end.innerHTML = options;

    if (state.topics.length > 5) {
      start.selectedIndex = 0;
      end.selectedIndex = 4;
    }
  }

  function openPathfinderModal(originId, targetId) {
    const modal = document.getElementById('pathfinder-modal');
    if (!modal) return;

    const start = document.getElementById('path-start-select');
    const end = document.getElementById('path-end-select');
    if (originId && start) start.value = originId;
    if (targetId && end) end.value = targetId;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closePathfinderModal() {
    const modal = document.getElementById('pathfinder-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  async function executePathfind() {
    const start = document.getElementById('path-start-select').value;
    const end = document.getElementById('path-end-select').value;
    const hintPanel = document.getElementById('pathfinder-initial-hint');
    const resultsPanel = document.getElementById('pathfinder-results');
    const hopsCount = document.getElementById('path-hops-count');
    const statusInfo = document.getElementById('path-status-info');
    const stepsFlow = document.getElementById('path-steps-flow');

    if (!start || !end) return;

    if (hintPanel) hintPanel.style.display = 'none';
    if (resultsPanel) resultsPanel.style.display = 'block';

    if (start === end) {
      const topicObj = state.topicMap.get(start);
      const title = topicObj ? topicObj.title : start;
      hopsCount.textContent = '0 Steps';
      statusInfo.textContent = 'Identical Topic Selected';
      stepsFlow.innerHTML = `
        <div class="path-no-route-card">
          <div class="no-route-icon">🎯</div>
          <div class="no-route-title">Start and Destination Are Identical</div>
          <p class="no-route-desc">You selected <strong>${escapeHtml(title)}</strong> for both start and destination. Please choose a different destination topic to compute the prerequisite path.</p>
        </div>
      `;
      return;
    }

    try {
      const data = await api.get(`/api/path?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`);

      const isSuggested = Boolean(data.suggested);
      if ((!data.found && !isSuggested) || !data.path || data.path.length === 0) {
        hopsCount.textContent = 'No Path';
        statusInfo.textContent = 'No Direct Sequence Found';
        stepsFlow.innerHTML = `
          <div class="path-no-route-card">
            <div class="no-route-icon">🔀</div>
            <div class="no-route-title">No Direct Prerequisite Pathway</div>
            <p class="no-route-desc">These topics are not connected by a directed prerequisite relationship, and the destination has no prerequisite chain to suggest.</p>
          </div>
        `;
        return;
      }

      // Compute total study time across path topics
      let totalMinutes = 0;
      data.path.forEach(step => {
        const t = state.topicMap.get(step.id);
        if (t && t.estimatedMinutes) totalMinutes += t.estimatedMinutes;
      });
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      hopsCount.textContent = isSuggested ? `${data.path.length} Steps (Suggested)` : `${data.path.length} Topics (${data.hops} Hops)`;
      statusInfo.textContent = `Est. Study Time: ${timeFormatted}`;

      const bannerHtml = isSuggested ? `
        <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:var(--radius-md); padding:12px 14px; margin-bottom:16px; font-size:12.5px; color:#92400e; display:flex; align-items:flex-start; gap:8px;">
          <span>💡</span>
          <div>
            <strong>Independent Tracks:</strong> No direct prerequisite connects these two topics. Below is the recommended prerequisite preparation chain for <strong>${escapeHtml(state.topicMap.get(end)?.title || end)}</strong>.
          </div>
        </div>
      ` : '';

      stepsFlow.innerHTML = bannerHtml + data.path.map((step, idx) => {
        const t = state.topicMap.get(step.id) || step;
        const diff = (t.difficulty || 'Beginner').toLowerCase();
        const status = t.status || 'Not Started';
        const mins = t.estimatedMinutes || 30;
        const isStart = idx === 0;
        const isEnd = idx === data.path.length - 1;
        const bulletSymbol = isStart ? '▶' : (isEnd ? '★' : `${idx + 1}`);

        return `
          <div class="journey-step-node" onclick="PathForge.openTopicDrawer('${step.id}')">
            <div class="journey-step-rail">
              <div class="journey-step-bullet ${isStart ? 'start-bullet' : (isEnd ? 'dest-bullet' : '')}">
                ${bulletSymbol}
              </div>
              ${!isEnd ? '<div class="journey-step-line"></div>' : ''}
            </div>
            <div class="journey-step-card">
              <div class="journey-step-top">
                <div class="journey-step-meta">
                  <span class="badge" style="text-transform:uppercase;">${escapeHtml(t.roadmapId || 'TRACK')}</span>
                  <span class="badge badge-difficulty ${diff}">${t.difficulty || 'Beginner'}</span>
                  <span class="journey-step-time">${mins}m</span>
                </div>
                <span class="status-pill" data-status="${status}">${status}</span>
              </div>
              <div class="journey-step-title">${escapeHtml(t.title)}</div>
              <div class="journey-step-footer">
                <span class="journey-step-link">Inspect topic curriculum ↗</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      showToast('Could not calculate path', 'error');
    }
  }

  // --- Global Event Bindings ---
  function initGlobalEvents() {
    const dropdown = document.getElementById('roadmaps-dropdown');
    const dropdownBtn = document.getElementById('btn-roadmaps-menu');
    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    // Modal Tabs Switching
    const tabButtons = document.querySelectorAll('#topic-tabs-bar .modal-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTopicTab(btn.dataset.tab);
      });
    });

    // Modal & Drawer Close Listeners
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closePathfinderModal();
        }
      });
    });

    const drawerBackdrop = document.getElementById('topic-drawer-backdrop');
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => closeTopicDrawer());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTopicDrawer();
        closePathfinderModal();
      }
    });

    const topicClose = document.getElementById('modal-close-btn');
    const topicFooterClose = document.getElementById('modal-footer-close');
    if (topicClose) topicClose.addEventListener('click', closeTopicDrawer);
    if (topicFooterClose) topicFooterClose.addEventListener('click', closeTopicDrawer);

    const pathClose = document.getElementById('pathfinder-close-btn');
    if (pathClose) pathClose.addEventListener('click', closePathfinderModal);

    const openPathBtn = document.getElementById('btn-open-pathfinder');
    if (openPathBtn) openPathBtn.addEventListener('click', () => openPathfinderModal());

    const execPathBtn = document.getElementById('btn-execute-pathfind');
    if (execPathBtn) execPathBtn.addEventListener('click', executePathfind);

    const swapPathBtn = document.getElementById('btn-swap-path');
    if (swapPathBtn) {
      swapPathBtn.addEventListener('click', () => {
        const start = document.getElementById('path-start-select');
        const end = document.getElementById('path-end-select');
        if (start && end) {
          const temp = start.value;
          start.value = end.value;
          end.value = temp;
          executePathfind();
        }
      });
    }

    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = document.getElementById('modal-code-snippet').textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
          showToast('Code copied to clipboard');
        });
      });
    }

    // Window resize redraws SVG connectors
    window.addEventListener('resize', () => {
      if (state.currentRoute.startsWith('/roadmap/')) {
        const rm = state.roadmapMap.get(state.currentRoute.replace('/roadmap/', ''));
        if (rm) drawRoadmapConnectors(rm);
      }
    });
  }

  // --- Public Interface ---
  window.PathForge = {
    openTopicModal: openTopicDrawer,
    openTopicDrawer,
    closeTopicDrawer,
    setRoadmapViewMode,
    zoomRoadmap,
    resetRoadmapZoom,
    setDashboardFilter(filter) {
      state.dashboardFilter = filter;
      renderDashboardView(document.getElementById('app-view'));
    },
    resetDashboardSearch() {
      state.dashboardSearch = '';
      state.dashboardFilter = 'all';
      renderDashboardView(document.getElementById('app-view'));
    },
    openPathfinderModal,
    closePathfinderModal,
    selectAssessmentSingle,
    toggleAssessmentMulti,
    prevAssessmentStep,
    nextAssessmentStep,
    requestRoadmapBtnClicked
  };

  // --- App Initialization ---
  async function init() {
    initGlobalEvents();
    initRouter();
    await preloadAppData();
    handleRoute();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
