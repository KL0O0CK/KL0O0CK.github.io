const state = {
  selectedThreats: new Set(),
  currentTheme: localStorage.getItem("theme") || "dark",
  threatsData: null,
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

async function loadThreatsData() {
  try {
    showLoading("threats-list", "Загрузка данных об угрозах...");
    const response = await fetch(
      "https://kl0o0ck.github.io/threats_final.json"
    );

    if (!response.ok) {
      throw new Error("Не удалось загрузить данные об угрозах");
    }

    state.threatsData = await response.json();
    loadThreatsList();
  } catch (error) {
    showError("threats-list", error.message);
  }
}

function getSortedThreats() {
  if (!state.threatsData) return [];

  return Object.keys(state.threatsData).sort((a, b) => {
    const numA = parseInt(a.split(".")[1]);
    const numB = parseInt(b.split(".")[1]);
    return numA - numB;
  });
}

function loadThreatsList() {
  try {
    const threats = getSortedThreats();
    renderThreatsList(threats);
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

function loadSelectedThreats() {
  if (state.selectedThreats.size === 0) {
    showError("threat-details", "Выберите хотя бы одну угрозу");
    return;
  }

  try {
    showLoading("threat-details", "Загрузка данных...");
    const data = getCombinedDetails(Array.from(state.selectedThreats));
    renderThreatsDetails(data);
  } catch (error) {
    showError("threat-details", error.message);
  }
}

function getCombinedDetails(selectedIds) {
  if (!state.threatsData)
    return { selected_threats: [], objects: [], implementations: [] };

  const combinedObjects = {};
  const combinedImplementations = {};

  selectedIds.forEach((threatId) => {
    if (state.threatsData[threatId]) {
      state.threatsData[threatId].objects?.forEach((obj) => {
        const objId = obj.id;
        if (!combinedObjects[objId]) {
          combinedObjects[objId] = obj;
        }
      });

      state.threatsData[threatId].implementations?.forEach((impl) => {
        const implId = impl.id;
        if (!combinedImplementations[implId]) {
          combinedImplementations[implId] = impl;
        }
      });
    }
  });

  return {
    selected_threats: selectedIds,
    objects: Object.values(combinedObjects),
    implementations: Object.values(combinedImplementations),
  };
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
                                  <strong class="impl-id">${impl.id}</strong>
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

function setupDetailsSearch() {
  const searchInput = document.getElementById("details-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const detailsSection = document.getElementById("threat-details");

      if (state.selectedThreats.size === 0) return;

      const items = detailsSection.querySelectorAll(".object-item, .impl-item");
      let hasVisibleItems = false;

      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        item.style.display = isVisible ? "" : "none";
        if (isVisible) hasVisibleItems = true;
      });

      const noResults = detailsSection.querySelector(".no-results");
      if (!hasVisibleItems && searchTerm) {
        if (!noResults) {
          const noResultsMsg = document.createElement("div");
          noResultsMsg.className = "empty-state no-results";
          noResultsMsg.textContent = "Ничего не найдено";
          detailsSection.appendChild(noResultsMsg);
        }
      } else if (noResults) {
        noResults.remove();
      }
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

  setupDetailsSearch();
  loadThreatsData();
}

init();
