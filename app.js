document.addEventListener("DOMContentLoaded", function () {
  const state = {
    selectedThreats: new Set(),
    currentTheme: localStorage.getItem("theme") || "dark",
  };

  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.currentTheme);
    updateThemeButton();
  }

  function toggleTheme() {
    state.currentTheme = state.currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.currentTheme);
    localStorage.setItem("theme", state.currentTheme);
    updateThemeButton();
  }

  function updateThemeButton() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.innerHTML =
        state.currentTheme === "dark"
          ? "<span>🌞</span> Светлая тема"
          : "<span>🌙</span> Тёмная тема";
    }
  }

  async function loadThreatsList() {
    try {
      showLoading("threats-list", "Загрузка списка угроз...");

      const response = await fetch("/api/threats");
      if (!response.ok) throw new Error("Ошибка загрузки списка угроз");

      const data = await response.json();
      renderThreatsList(data.threats);
    } catch (error) {
      showError("threats-list", error.message);
    }
  }

  function renderThreatsList(threats) {
    const threatsList = document.getElementById("threats-list");
    threatsList.innerHTML = "";

    threats.forEach((threat) => {
      const button = document.createElement("button");
      button.className = "threat-btn";
      button.textContent = threat;
      button.dataset.threat = threat;

      if (state.selectedThreats.has(threat)) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => toggleThreatSelection(threat));
      threatsList.appendChild(button);
    });
  }

  function toggleThreatSelection(threatId) {
    if (state.selectedThreats.has(threatId)) {
      state.selectedThreats.delete(threatId);
    } else {
      state.selectedThreats.add(threatId);
    }

    const button = document.querySelector(
      `.threat-btn[data-threat="${threatId}"]`
    );
    if (button) {
      button.classList.toggle("selected", state.selectedThreats.has(threatId));
    }

    updateShowButtonState();
  }

  async function loadSelectedThreats() {
    if (state.selectedThreats.size === 0) {
      showError("threat-details", "Выберите хотя бы одну угрозу");
      return;
    }

    try {
      showLoading("threat-details", "Загрузка данных...");

      const response = await fetch(
        `/api/threats/details?threat_ids=${Array.from(
          state.selectedThreats
        ).join(",")}`
      );
      if (!response.ok) throw new Error("Ошибка загрузки данных");

      const data = await response.json();
      renderThreatsDetails(data);
    } catch (error) {
      showError("threat-details", error.message);
    }
  }

  function renderThreatsDetails(data) {
    const threatDetails = document.getElementById("threat-details");

    threatDetails.innerHTML = `
          <div class="summary-section">
              <h2>Выбрано угроз: ${data.selected_threats.length}</h2>
              <div class="threats-chips">
                  ${data.selected_threats
                    .map(
                      (threat) => `
                      <span class="threat-chip">${threat}</span>
                  `
                    )
                    .join("")}
              </div>

              <div class="section">
                  <h3>Общие объекты воздействия (${data.objects.length})</h3>
                  ${
                    data.objects.length > 0
                      ? `
                      <ul class="item-list">
                          ${data.objects
                            .map(
                              (obj) => `
                              <li class="object-item">
                                  <strong>${obj.id}</strong>: ${obj.name}
                                  ${
                                    obj.type
                                      ? `<div class="item-meta">Тип: ${obj.type}</div>`
                                      : ""
                                  }
                              </li>
                          `
                            )
                            .join("")}
                      </ul>
                  `
                      : '<div class="empty-state">Нет общих объектов</div>'
                  }
              </div>

              <div class="section">
                  <h3>Способы реализации (${data.implementations.length})</h3>
                  ${
                    data.implementations.length > 0
                      ? `
                      <ul class="item-list">
                          ${data.implementations
                            .map(
                              (impl) => `
                              <li class="impl-item">
                                  <div class="impl-header">
                                      <strong class="impl-id">${
                                        impl.id
                                      }</strong>
                                      <span>${impl.name}</span>
                                  </div>
                                  ${
                                    impl.category
                                      ? `<div class="item-meta">Категория: ${impl.category}</div>`
                                      : ""
                                  }
                                  ${
                                    impl.risk_level
                                      ? `<div class="item-meta">Уровень риска: ${impl.risk_level}</div>`
                                      : ""
                                  }
                              </li>
                          `
                            )
                            .join("")}
                      </ul>
                  `
                      : '<div class="empty-state">Нет способов реализации</div>'
                  }
              </div>
          </div>
      `;
  }

  function updateShowButtonState() {
    const showBtn = document.getElementById("show-selected");
    if (showBtn) {
      showBtn.disabled = state.selectedThreats.size === 0;
    }
  }

  function clearSelection() {
    state.selectedThreats.clear();
    document.querySelectorAll(".threat-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });
    document.getElementById("threat-details").innerHTML =
      '<div class="empty-state">Выберите угрозы из списка</div>';
    updateShowButtonState();
  }

  function setupSearch() {
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll(".threat-btn").forEach((btn) => {
          const threatId = btn.textContent.toLowerCase();
          btn.style.display = threatId.includes(searchTerm) ? "block" : "none";
        });
      });
    }
  }

  function showLoading(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="loading">${message}</div>`;
    }
  }

  function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  function init() {
    initTheme();

    document
      .getElementById("show-selected")
      ?.addEventListener("click", loadSelectedThreats);
    document
      .getElementById("clear-selection")
      ?.addEventListener("click", clearSelection);
    document
      .getElementById("theme-toggle")
      ?.addEventListener("click", toggleTheme);

    setupSearch();
    loadThreatsList();
  }

  init();
});
