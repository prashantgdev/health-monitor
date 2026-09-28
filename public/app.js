const endpointList = document.getElementById("endpointList"),
  totalCount = document.getElementById("totalCount"),
  upCount = document.getElementById("upCount"),
  downCount = document.getElementById("downCount"),
  modal = document.getElementById("modal"),
  addButton = document.getElementById("addButton"),
  emptyAddButton = document.getElementById("emptyAddButton"),
  closeModal = document.getElementById("closeModal"),
  cancelButton = document.getElementById("cancelButton"),
  modalBackdrop = document.getElementById("modalBackdrop"),
  monitorForm = document.getElementById("monitorForm"),
  titleInput = document.getElementById("title"),
  urlInput = document.getElementById("url"),
  formError = document.getElementById("formError"),
  // ---------------------------------------------------------
  // Interval picker
  // --------------------------------------------------------
  intervalSlider = document.getElementById("intervalSlider"),
  intervalDisplay = document.getElementById("intervalDisplay"),
  customInterval = document.getElementById("customInterval"),
  customIntervalValue = document.getElementById("customIntervalValue"),
  customIntervalUnit = document.getElementById("customIntervalUnit"),
  // Slider positions
  intervalOptions = [
    {
      seconds: 15,
      label: "15 seconds",
    },

    {
      seconds: 30,
      label: "30 seconds",
    },

    {
      seconds: 60,
      label: "1 minute",
    },

    {
      seconds: 300,
      label: "5 minutes",
    },

    {
      seconds: 600,
      label: "10 minutes",
    },

    {
      seconds: 900,
      label: "15 minutes",
    },

    {
      seconds: 1800,
      label: "30 minutes",
    },

    {
      seconds: 3600,
      label: "1 hour",
    },

    {
      custom: true,
      label: "Custom",
    },
  ],
  modalTitle = document.getElementById("modalTitle"),
  monitorSubmitButton = document.getElementById("monitorSubmitButton");

let editingMonitorId = null,
  originalMonitorValues = null;

// Hidden value submitted to server
let selectedInterval = 300;

// ---------------------------------------------------------
// Modal
// ---------------------------------------------------------

function openModal() {
  editingMonitorId = null;

  modalTitle.textContent = "Add monitor";
  monitorSubmitButton.textContent = "Add monitor";

  monitorForm.reset();

  customInterval.classList.add("hidden");

  customIntervalValue.value = "";
  customIntervalUnit.value = "minutes";

  intervalSlider.value = 3;
  selectedInterval = 300;

  updateIntervalSlider();

  formError.classList.add("hidden");
  formError.textContent = "";

  modal.classList.remove("hidden");

  setTimeout(() => urlInput.focus(), 50);
}

function closeModalWindow() {
  modal.classList.add("hidden");

  editingMonitorId = null;
  originalMonitorValues = null;

  monitorForm.reset();

  customInterval.classList.add("hidden");

  customIntervalValue.value = "";
  customIntervalUnit.value = "minutes";

  intervalSlider.value = 3;
  selectedInterval = 300;

  updateIntervalSlider();

  formError.classList.add("hidden");
  formError.textContent = "";

  modalTitle.textContent = "Add monitor";
  monitorSubmitButton.textContent = "Add monitor";
}

addButton.addEventListener("click", openModal);
emptyAddButton.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalWindow);
cancelButton.addEventListener("click", closeModalWindow);
modalBackdrop.addEventListener("click", closeModalWindow);

// ---------------------------------------------------------
// Interval slider
// ---------------------------------------------------------

function updateIntervalSlider() {
  const index = Number(intervalSlider.value),
    option = intervalOptions[index],
    progress = (index / (intervalOptions.length - 1)) * 100;

  intervalSlider.style.setProperty("--slider-progress", `${progress}%`);

  if (option.custom) {
    intervalDisplay.textContent = "Custom interval";

    customInterval.classList.remove("hidden");

    return;
  }

  customInterval.classList.add("hidden");

  selectedInterval = option.seconds;
  intervalDisplay.textContent = option.label;
}

intervalSlider.addEventListener("input", updateIntervalSlider);

// ---------------------------------------------------------
// Custom interval
// ---------------------------------------------------------

function getCustomInterval() {
  const value = Number(customIntervalValue.value);

  if (!Number.isInteger(value) || value < 1) return null;
  if (customIntervalUnit.value === "minutes") return value * 60;
  if (customIntervalUnit.value === "hours") return value * 3600;

  return null;
}

customIntervalValue.addEventListener("input", () => {
  const value = getCustomInterval();

  if (value !== null) {
    selectedInterval = value;
    intervalDisplay.textContent = formatInterval(value);
  }
});

customIntervalUnit.addEventListener("change", () => {
  const value = getCustomInterval();

  if (value !== null) {
    selectedInterval = value;

    intervalDisplay.textContent = formatInterval(value);
  }
});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInterval(seconds) {
  if (seconds < 60) return `Every ${seconds} seconds`;

  if (seconds < 3600) {
    const minutes = seconds / 60;

    if (minutes === 1) return "Every 1 minute";

    return `Every ${minutes} minutes`;
  }

  const hours = seconds / 3600;

  if (hours === 1) return "Every 1 hour";

  return `Every ${hours} hours`;
}

function formatDate(date) {
  if (!date) return "Never";

  return new Date(date).toLocaleString();
}

function formatResponseTime(ms) {
  if (ms === null || ms === undefined) return "-";

  return `${ms} ms`;
}

function getStatusText(status) {
  if (status === "up") return "Healthy";
  if (status === "down") return "Down";

  return "Checking";
}

// ---------------------------------------------------------
// Load monitors
// ---------------------------------------------------------

async function loadMonitors() {
  try {
    const response = await fetch("/api/monitors");

    if (!response.ok) throw new Error();

    const monitors = await response.json();

    renderStats(monitors);
    renderMonitors(monitors);
  } catch {
    endpointList.innerHTML = `<div class="empty-state">
        <div class="empty-icon">!</div>
        <h3>
          Unable to load monitors
        </h3>
        <p>
          The monitor server may be unavailable.
        </p>
      </div>`;
  }
}

// ---------------------------------------------------------
// Stats
// ---------------------------------------------------------

function renderStats(monitors) {
  const total = monitors.length,
    up = monitors.filter((monitor) => monitor.status === "up").length,
    down = monitors.filter((monitor) => monitor.status === "down").length;

  totalCount.textContent = total;
  upCount.textContent = up;
  downCount.textContent = down;
}

// ---------------------------------------------------------
// Render monitors
// ---------------------------------------------------------

function renderMonitors(monitors) {
  if (monitors.length === 0) {
    endpointList.innerHTML = `<div class="empty-state">
        <div class="empty-icon">
          ♥
        </div>
        <h3>
          No endpoints yet
        </h3>
        <p>
          Add your first health endpoint
          to start monitoring.
        </p>
        <button
          class="primary-button"
          onclick="openModal()"
        >
          Add endpoint
        </button>
      </div>`;

    return;
  }

  endpointList.innerHTML = monitors.map(createMonitorHtml).join("");
}

// ---------------------------------------------------------
// Monitor card
// ---------------------------------------------------------

function createMonitorHtml(monitor) {
  const status =
    monitor.status === "up"
      ? "up"
      : monitor.status === "down"
        ? "down"
        : "checking";

  return `
    <div class="monitor">

      <span
        class="monitor-status ${status}"
      ></span>


      <div class="monitor-main">

        <div class="monitor-data">

          <h3 class="monitor-title">
            ${escapeHtml(monitor.title)}
          </h3>

          <small class="monitor-url">
            ${escapeHtml(monitor.url)}
          </small>

        </div>
        

        <div class="monitor-meta">
          <div>
            <span>
              HTTP:
              ${monitor.statusCode ?? "-"}
            </span>
            <span>
              Response:
              ${formatResponseTime(monitor.responseTime)}
            </span>
          </div>
          <div>
            <span>
              ${formatInterval(monitor.interval)}
            </span>
            <span>
              Last checked:
              ${formatDate(monitor.lastChecked)}
            </span>
          </div>
        </div>

      </div>


      <span
        class="status-badge ${status}"
        data-status-badge="${monitor.id}"
      >
        ${getStatusText(monitor.status)}
      </span>


      <button
        class="endpoint-menu-button"
        type="button"
        aria-label="Endpoint options"
        aria-haspopup="menu"
        aria-expanded="false"
        data-endpoint-id="${monitor.id}"
      >
        ⋮
      </button>

    </div>
  `;
}

// ---------------------------------------------------------
// Add monitor
// ---------------------------------------------------------

monitorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim(),
    url = urlInput.value.trim();

  if (!title) {
    showFormError("Please enter a title for this monitor.");

    return;
  }

  if (!url) {
    showFormError("Please enter a health endpoint URL.");

    return;
  }

  // Get interval from the slider/custom editor
  // every single time the form is submitted.
  const sliderIndex = Number(intervalSlider.value);

  const selectedOption = intervalOptions[sliderIndex];

  let interval;

  if (selectedOption?.custom) {
    interval = getCustomInterval();

    if (interval === null) {
      showFormError("Please enter a valid custom interval.");

      return;
    }
  } else interval = selectedOption?.seconds;

  if (!Number.isInteger(interval)) {
    showFormError("Please select a valid check interval.");

    return;
  }

  const isEditing = Boolean(editingMonitorId);

  if (
    isEditing &&
    originalMonitorValues &&
    title === originalMonitorValues.title &&
    url === originalMonitorValues.url &&
    interval === originalMonitorValues.interval
  ) {
    showFormError("No changes were made to this monitor.");

    return;
  }

  const requestUrl = isEditing
    ? `/api/monitors/${editingMonitorId}`
    : "/api/monitors";

  const requestMethod = isEditing ? "PUT" : "POST";

  try {
    monitorSubmitButton.disabled = true;

    const response = await fetch(requestUrl, {
      method: requestMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        url,
        interval,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save monitor.");
    }

    await loadMonitors();
    closeModalWindow();
  } catch (error) {
    showFormError(error.message || "Failed to save monitor.");
  } finally {
    monitorSubmitButton.disabled = false;
  }
});

function showFormError(message) {
  formError.textContent = message;

  formError.classList.remove("hidden");
}

// ---------------------------------------------------------
// Delete monitor
// ---------------------------------------------------------

async function deleteMonitor(id) {
  const confirmed = confirm("Remove this endpoint from monitoring?");

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/monitors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error();

    await loadMonitors();
  } catch {
    alert("Unable to remove the endpoint.");
  }
}

const endpointContextMenu = document.getElementById("endpointContextMenu");

let contextMenuEndpointId = null;

function closeEndpointContextMenu() {
  endpointContextMenu.classList.add("hidden");
  contextMenuEndpointId = null;
}

function openEndpointContextMenu(menuButton, endpointId) {
  contextMenuEndpointId = endpointId;

  const buttonRect = menuButton.getBoundingClientRect();

  endpointContextMenu.classList.toggle("hidden");

  const menuWidth = endpointContextMenu.offsetWidth;

  const menuHeight = endpointContextMenu.offsetHeight;

  let left = buttonRect.right - menuWidth;

  let top = buttonRect.bottom + 6;

  // Keep inside viewport horizontally.
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

  // Open upward if there isn't enough space below.
  if (top + menuHeight > window.innerHeight - 8) {
    top = buttonRect.top - menuHeight - 6;
  }

  top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));

  endpointContextMenu.style.left = `${left}px`;

  endpointContextMenu.style.top = `${top}px`;
}

endpointList.addEventListener("click", (event) => {
  const menuButton = event.target.closest(".endpoint-menu-button");

  if (!menuButton) {
    return;
  }

  event.stopPropagation();

  openEndpointContextMenu(menuButton, menuButton.dataset.endpointId);
});

function setIntervalEditor(seconds) {
  const fixedIndex = intervalOptions.findIndex(
    (option) => !option.custom && option.seconds === seconds,
  );

  if (fixedIndex !== -1) {
    intervalSlider.value = fixedIndex;

    customInterval.classList.add("hidden");

    customIntervalValue.value = "";

    updateIntervalSlider();

    return;
  }

  // Anything that isn't one of the predefined
  // intervals becomes Custom.

  intervalSlider.value = intervalOptions.length - 1;

  customInterval.classList.remove("hidden");

  if (seconds % 3600 === 0) {
    customIntervalValue.value = seconds / 3600;
    customIntervalUnit.value = "hours";
  } else {
    customIntervalValue.value = seconds / 60;
    customIntervalUnit.value = "minutes";
  }

  intervalDisplay.textContent = formatInterval(seconds);

  intervalSlider.style.setProperty("--slider-progress", "100%");

  selectedInterval = seconds;
}

async function handleEditEndpoint(endpointId) {
  try {
    const response = await fetch("/api/monitors"),
      monitors = await response.json();

    if (!response.ok)
      throw new Error(monitors.error || "Failed to load endpoint.");

    const monitor = monitors.find((item) => item.id === endpointId);

    if (!monitor) throw new Error("Endpoint could not be found.");

    editingMonitorId = endpointId;

    originalMonitorValues = {
      title: monitor.title || "",
      url: monitor.url || "",
      interval: monitor.interval,
    };

    // Populate the form.
    titleInput.value = monitor.title || "";
    urlInput.value = monitor.url || "";

    setIntervalEditor(monitor.interval);

    // Change modal into edit mode.
    modalTitle.textContent = "Edit monitor";
    monitorSubmitButton.textContent = "Save changes";

    formError.classList.add("hidden");
    formError.textContent = "";

    modal.classList.remove("hidden");
  } catch (error) {
    alert(error.message || "Failed to load endpoint.");
  }
}

async function handleCheckEndpoint(endpointId) {
  // Immediately show Checking...
  updateStatusBadge(endpointId, "checking");

  try {
    const response = await fetch(`/api/monitors/${endpointId}/check`, {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check endpoint.");
    }

    // Use the status returned by the monitor API.
    updateStatusBadge(endpointId, data.status);

    // Refresh the rest of the monitor data
    // such as response time and last checked.
    await loadMonitors();
  } catch (error) {
    // Restore the actual state from the API
    // by refreshing the monitors.
    await loadMonitors();

    alert(error.message || "Failed to check endpoint.");
  }
}

function updateStatusBadge(endpointId, status) {
  const badge = document.querySelector(`[data-status-badge="${endpointId}"]`);
  const statusClass =
    status === "up" ? "up" : status === "down" ? "down" : "checking";

  if (!badge) return;

  badge.classList.remove("checking", "healthy", "down");

  badge.classList.add(statusClass);

  badge.textContent = getStatusText(status);
}

endpointContextMenu.addEventListener("click", async (event) => {
  const actionButton = event.target.closest(".context-menu-item");

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;

  const endpointId = contextMenuEndpointId;

  closeEndpointContextMenu();

  if (!endpointId) {
    return;
  }

  switch (action) {
    case "edit":
      handleEditEndpoint(endpointId);
      break;

    case "check":
      handleCheckEndpoint(endpointId);
      break;

    case "delete":
      deleteMonitor(endpointId);
      break;
  }
});

document.addEventListener("click", (event) => {
  if (
    !event.target.closest(".endpoint-context-menu") &&
    !event.target.closest(".endpoint-menu-button")
  ) {
    closeEndpointContextMenu();
  }
});

window.addEventListener("resize", () => closeEndpointContextMenu());

window.addEventListener(
  "scroll",
  () => {
    closeEndpointContextMenu();
  },
  true,
);

// ---------------------------------------------------------
// Initial load
// ---------------------------------------------------------

updateIntervalSlider();
loadMonitors();

// Refresh dashboard every 5 seconds.

setInterval(loadMonitors, 5000);
