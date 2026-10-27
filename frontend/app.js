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
    geminiApiKey: ''
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

      updateGlobalProgress();
      populatePathfinderSelects();
    } catch (err) {
      console.error('Data preload failed:', err);
      showToast('Could not load data from server.', 'error');
    }
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

    const careers = state.roadmaps.filter(r => r.type === 'profession');
    const languages = state.roadmaps.filter(r => r.type === 'language');
    const subroadmaps = state.roadmaps.filter(r => r.type === 'subroadmap');

    let completedCount = 0;
    state.topics.forEach(t => { if (t.status === 'Completed') completedCount++; });

    let html = `
      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-header-content">
          <div class="hero-badge-pill">
            <span class="badge-dot"></span>
            <span>Developer Learning Paths & Curricula</span>
          </div>
          <h1 class="hero-title">Navigate Your Engineering Growth</h1>
          <p class="hero-desc">
            Prerequisite structures, curated modules, and step-by-step topic guides designed to take you from foundational concepts to production-grade engineering.
          </p>
        </div>
        <div class="hero-stats-row">
          <div class="hero-stat-item">
            <span class="stat-num">${state.stats.topics || 48}</span>
            <span class="stat-label">Total Topics</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat-item">
            <span class="stat-num">${state.stats.roadmaps || 9}</span>
            <span class="stat-label">Tracks</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat-item">
            <span class="stat-num stat-completed">${completedCount}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat-item">
            <span class="stat-num stat-percent">${Math.round((completedCount / (state.topics.length || 1)) * 100)}%</span>
            <span class="stat-label">Progress</span>
          </div>
        </div>
      </section>

      <!-- Prominent Non-Compulsory Onboarding Assessment Prompt -->
      <section class="assessment-prompt-card mb-8">
        <div class="assessment-prompt-content">
          <div class="assessment-prompt-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <div class="assessment-prompt-text-group">
            <div class="prompt-mini-tag">AI-Assisted Guidance</div>
            <h3 class="assessment-prompt-title">Unsure which roadmap to follow?</h3>
            <p class="assessment-prompt-desc">Take our quick 2-minute assessment to discover the ideal personalized roadmap tailored to your experience, schedule, and goals.</p>
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
              <p class="section-desc">Topics ready for you to explore based on your completed prerequisites</p>
            </div>
          </div>
          <div class="recommendations-grid">
            ${recommendations.slice(0, 4).map(t => `
              <div class="rec-topic-card" onclick="location.hash='#/topic/${t.id}'">
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
                  <span style="color:var(--accent-blue); font-weight:500;">View Topic →</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Career Tracks Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Career Paths</h2>
            <p class="section-desc">Role-based learning roadmaps for modern software disciplines</p>
          </div>
        </div>
        <div class="grid-careers">
          ${careers.map(c => renderCareerCard(c)).join('')}
        </div>
      </section>

      <!-- Core Languages Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Programming Languages</h2>
            <p class="section-desc">Core language fundamentals, syntax, and paradigms</p>
          </div>
        </div>
        <div class="grid-languages">
          ${languages.map(l => renderLanguageCard(l)).join('')}
        </div>
      </section>

      <!-- Sub-Roadmaps Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Topic Deep Dives</h2>
            <p class="section-desc">Focused modules for specific domains and foundational concepts</p>
          </div>
        </div>
        <div class="grid-subroadmaps">
          ${subroadmaps.map(sr => renderSubroadmapCard(sr)).join('')}
        </div>
      </section>
    `;

    container.innerHTML = html;
  }

  function renderCareerCard(career) {
    let totalTopics = 0;
    let completedTopics = 0;

    const stages = career.sections || career.stages || [];
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
    const iconClass = career.id === 'ai-ml-engineer' ? 'card-icon-aiml' : career.id === 'backend-developer' ? 'card-icon-backend' : 'card-icon-fullstack';

    return `
      <div class="career-card" onclick="location.hash='#/roadmap/${career.id}'">
        <div class="card-top">
          <div class="card-icon ${iconClass}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span class="badge badge-difficulty advanced">${escapeHtml(career.level)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(career.title)}</h3>
        <p class="card-desc">${escapeHtml(career.description)}</p>

        <div class="card-stages-preview">
          ${stages.slice(0, 3).map(s => `<span class="stage-pill">${escapeHtml(s.title)}</span>`).join('')}
        </div>

        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${pct}%;"></div>
        </div>

        <div class="card-meta-row">
          <span>${completedTopics}/${totalTopics} Completed</span>
          <span style="font-weight:600;">${pct}%</span>
        </div>
      </div>
    `;
  }

  function renderLanguageCard(lang) {
    let totalTopics = 0;
    let completedTopics = 0;

    const sections = lang.sections || [];
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

    return `
      <div class="lang-card" onclick="location.hash='#/roadmap/${lang.id}'">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-size:15px; font-weight:600;">${escapeHtml(lang.title)}</h3>
          <span class="badge">${lang.estimatedHours}h</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:12px;">${escapeHtml(lang.description)}</p>
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="card-meta-row">
          <span>${completedTopics}/${totalTopics} topics</span>
          <span>${pct}%</span>
        </div>
      </div>
    `;
  }

  function renderSubroadmapCard(sr) {
    return `
      <div class="subroadmap-card" onclick="location.hash='#/roadmap/${sr.id}'">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span class="badge" style="color:var(--accent-cyan);">Sub-Roadmap</span>
          <span class="badge">${sr.estimatedHours}h</span>
        </div>
        <h3 style="font-size:15px; font-weight:600; margin-bottom:6px;">${escapeHtml(sr.title)}</h3>
        <p style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;">${escapeHtml(sr.description)}</p>
        <span style="color:var(--accent-blue); font-size:12px; font-weight:500;">Explore Roadmaps →</span>
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

    const systemPrompt = `You are PathForge AI Roadmap Evaluator.
Given a user's onboarding assessment answers, determine the single best matching roadmap from our exact 9 catalog items:
- ai-ml-engineer: AI & Machine Learning Engineer
- backend-developer: Backend Systems Developer
- fullstack-developer: Full-Stack Web Developer
- c: C Programming Language
- java: Java Platform Engineering
- python: Python Development
- dsa: Data Structures & Algorithms
- machine-learning: Machine Learning Pipeline
- backend-development: Backend Architecture Core

RULES:
If the user's target role or requested track is NOT among these 9 (e.g. Mobile App Developer, Game Developer, Cybersecurity, DevOps, etc.), respond with JSON:
{ "matched_id": null }

If there is a match among the 9 items, respond with JSON:
{ "matched_id": "<one_of_the_9_ids_above>" }`;

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
    const targetRole = answers.target_role || '';
    const knownLangs = answers.known_languages || [];
    const dsaLevel = answers.dsa_level || 'None';

    const availableRoadmaps = [
      { id: 'ai-ml-engineer', title: 'AI & ML Engineer', keywords: ['AI & Machine Learning', 'AI', 'Machine Learning'] },
      { id: 'backend-developer', title: 'Backend Systems Developer', keywords: ['Backend & Systems', 'Backend Developer', 'Backend'] },
      { id: 'fullstack-developer', title: 'Full-Stack Web Developer', keywords: ['Full-Stack', 'Web Developer'] },
      { id: 'c', title: 'C Programming Language', keywords: ['C Programming', 'C / C++'] },
      { id: 'java', title: 'Java Platform Engineering', keywords: ['Java'] },
      { id: 'python', title: 'Python Development', keywords: ['Python'] },
      { id: 'dsa', title: 'Data Structures & Algorithms', keywords: ['Data Structures', 'DSA'] },
      { id: 'machine-learning', title: 'Machine Learning Pipeline', keywords: ['Machine Learning Pipeline'] },
      { id: 'backend-development', title: 'Backend Architecture Core', keywords: ['Backend Architecture'] }
    ];

    let matchedRoadmap = await callGeminiAPI(answers, availableRoadmaps);

    if (matchedRoadmap === null) {
      // Local fallback rules matching the Gemini system prompt catalog
      if (targetRole.includes('Full-Stack')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'fullstack-developer');
      } else if (targetRole.includes('Backend')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'backend-developer');
      } else if (targetRole.includes('AI & Machine Learning')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'ai-ml-engineer');
      } else if (targetRole.includes('Data Structures')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'dsa');
      } else if (knownLangs.includes('C / C++') && dsaLevel === 'None') {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'c');
      } else if (knownLangs.includes('Java')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'java');
      } else if (knownLangs.includes('Python')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'python');
      } else if (targetRole.includes('General')) {
        matchedRoadmap = availableRoadmaps.find(r => r.id === 'fullstack-developer');
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

  // --- View: Roadmap Detail ---
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

      let html = `
        <div class="roadmap-view-header">
          <div class="roadmap-header-top">
            <div class="roadmap-title-row">
              <div class="roadmap-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h1 class="roadmap-view-title">${escapeHtml(roadmap.title)}</h1>
                <span class="badge" style="text-transform:uppercase;">${escapeHtml(roadmap.type)}</span>
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:20px; font-weight:700; color:var(--accent-emerald);">${pct}%</span>
              <div style="font-size:11px; color:var(--text-muted);">${completedTopics} of ${totalTopics} completed</div>
            </div>
          </div>
          <p class="roadmap-view-desc">${escapeHtml(roadmap.description)}</p>
          <div class="card-progress-bar" style="margin-bottom:14px;">
            <div class="card-progress-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="roadmap-meta-tags">
            <span class="badge badge-difficulty intermediate">Level: ${escapeHtml(roadmap.level)}</span>
            <span class="badge">Est: ${roadmap.estimatedHours} Hours</span>
            <span class="badge">${sections.length} Sections</span>
          </div>
        </div>

        <div class="sections-timeline">
          ${sections.map((sec, idx) => `
            <div class="section-block">
              <h3 class="section-block-title">
                <span class="badge" style="border-radius:50%; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center;">${idx + 1}</span>
                <span>${escapeHtml(sec.title)}</span>
              </h3>
              <div class="topic-cards-container">
                ${(sec.topicIds || []).map(tid => renderTopicNode(tid)).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <h2 style="margin-bottom:8px;">Roadmap not found</h2>
          <p style="color:var(--text-secondary); margin-bottom:16px;">The roadmap '${escapeHtml(roadmapId)}' could not be loaded.</p>
          <a href="#/" class="btn btn-primary">Return to Dashboard</a>
        </div>
      `;
    }
  }

  function renderTopicNode(topicId) {
    const t = state.topicMap.get(topicId);
    if (!t) return `<div class="topic-node-card">Topic ${escapeHtml(topicId)} missing</div>`;

    const isSubroadmap = t.type === 'subroadmap';

    return `
      <div class="topic-node-card" onclick="PathForge.openTopicModal('${t.id}')">
        <div class="topic-node-top">
          <span class="badge badge-difficulty ${t.difficulty.toLowerCase()}">${t.difficulty}</span>
          <span class="status-pill" data-status="${t.status}">${t.status}</span>
        </div>
        <h4 class="topic-node-title">${escapeHtml(t.title)}</h4>
        <p class="topic-node-summary">${escapeHtml(t.summary || '')}</p>
        <div class="topic-node-footer">
          <span style="color:var(--text-muted);">${t.estimatedMinutes}m</span>
          ${isSubroadmap ? `<span class="badge" style="color:var(--accent-cyan);">Sub-Roadmap ↗</span>` : `<span style="color:var(--accent-blue);">View Topic →</span>`}
        </div>
      </div>
    `;
  }

  // --- Topic Detail Modal Tabs ---
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

  // --- Topic Detail Modal ---
  async function openTopicModal(topicId) {
    const modal = document.getElementById('topic-modal');
    if (!modal) return;

    // Reset view to primary overview tab
    switchTopicTab('tab-overview');

    try {
      const topic = await api.get(`/api/topics/${topicId}`);

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
        btn.onclick = () => updateTopicStatusFromModal(topic.id, btn.dataset.status);
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
              <span class="badge" style="cursor:pointer; padding:4px 8px;" onclick="PathForge.openTopicModal('${pid}')">
                ${escapeHtml(title)}
                <span class="status-pill" data-status="${status}" style="font-size:9px; padding:1px 4px;">${status}</span>
              </span>
            `;
          }).join('');
        } else {
          prereqsList.innerHTML = `<span class="muted-text">None required (Foundational topic)</span>`;
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
          closeTopicModal();
          location.hash = `#/roadmap/${topic.targetSubroadmap}`;
        };
      } else {
        srCallout.style.display = 'none';
      }

      // Find Path Here Button
      const findPathBtn = document.getElementById('modal-btn-find-path');
      if (findPathBtn) {
        findPathBtn.onclick = () => {
          closeTopicModal();
          openPathfinderModal(null, topic.id);
        };
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    } catch (err) {
      console.error('Failed to load topic details:', err);
    }
  }

  async function updateTopicStatusFromModal(topicId, newStatus) {
    try {
      await api.post('/api/progress', { topicId, status: newStatus });
      await preloadAppData();

      const statusButtons = document.querySelectorAll('#modal-status-group .status-btn');
      statusButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === newStatus);
      });

      showToast(`Status updated: ${newStatus}`);

      if (state.currentRoute.startsWith('/roadmap/')) {
        renderRoadmapView(document.getElementById('app-view'), state.currentRoute.replace('/roadmap/', ''));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update progress', 'error');
    }
  }

  function closeTopicModal() {
    const modal = document.getElementById('topic-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
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

      if (!data.found || !data.path || data.path.length === 0) {
        hopsCount.textContent = 'No Path';
        statusInfo.textContent = 'No Direct Sequence Found';
        stepsFlow.innerHTML = `
          <div class="path-no-route-card">
            <div class="no-route-icon">🔀</div>
            <div class="no-route-title">No Direct Prerequisite Pathway</div>
            <p class="no-route-desc">These topics belong to independent tracks or there is no directed dependency between them.</p>
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

      hopsCount.textContent = `${data.path.length} Topics (${data.hops} Hops)`;
      statusInfo.textContent = `Est. Study Time: ${timeFormatted}`;

      stepsFlow.innerHTML = data.path.map((step, idx) => {
        const t = state.topicMap.get(step.id) || step;
        const diff = (t.difficulty || 'Beginner').toLowerCase();
        const status = t.status || 'Not Started';
        const mins = t.estimatedMinutes || 30;
        const isStart = idx === 0;
        const isEnd = idx === data.path.length - 1;
        const bulletSymbol = isStart ? '▶' : (isEnd ? '★' : `${idx + 1}`);

        return `
          <div class="journey-step-node" onclick="PathForge.openTopicModal('${step.id}')">
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

    // Modal Close Listeners
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeTopicModal();
          closePathfinderModal();
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTopicModal();
        closePathfinderModal();
      }
    });

    const topicClose = document.getElementById('modal-close-btn');
    const topicFooterClose = document.getElementById('modal-footer-close');
    if (topicClose) topicClose.addEventListener('click', closeTopicModal);
    if (topicFooterClose) topicFooterClose.addEventListener('click', closeTopicModal);

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
  }

  // --- Public Interface ---
  window.PathForge = {
    openTopicModal,
    openPathfinderModal,
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
