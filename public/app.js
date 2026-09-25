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
  ];

// Hidden value submitted to server
let selectedInterval = 300;

// ---------------------------------------------------------
// Modal
// ---------------------------------------------------------

function openModal() {
  modal.classList.remove("hidden");

  setTimeout(() => {
    urlInput.focus();
  }, 50);
}

function closeModalWindow() {
  modal.classList.add("hidden");
  monitorForm.reset();
  customInterval.classList.add("hidden");

  customIntervalValue.value = "";
  customIntervalUnit.value = "minutes";
  intervalSlider.value = 3;
  selectedInterval = 300;

  updateIntervalSlider();
  formError.classList.add("hidden");

  formError.textContent = "";
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

  formError.classList.add("hidden");

  if (!title) {
    showFormError("Please enter a title for this monitor.");

    return;
  }

  if (!url) {
    showFormError("Please enter a health endpoint URL.");

    return;
  }

  try {
    new URL(url);
  } catch {
    showFormError("Please enter a valid URL.");

    return;
  }

  let interval;

  const sliderIndex = Number(intervalSlider.value),
    selectedOption = intervalOptions[sliderIndex];

  if (selectedOption.custom) {
    interval = getCustomInterval();

    if (interval === null) {
      showFormError("Please enter a valid custom interval.");

      return;
    }
  } else interval = selectedOption.seconds;

  try {
    const response = await fetch("/api/monitors", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        title,
        url,
        interval,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      showFormError(result.error || "Unable to add endpoint.");

      return;
    }

    closeModalWindow();

    await loadMonitors();
  } catch {
    showFormError("Could not connect to the monitor server.");
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

function handleEditEndpoint(endpointId) {
  console.log("Edit endpoint:", endpointId);

  // Open your edit modal here later.
}

function handleCheckEndpoint(endpointId) {
  console.log("Check endpoint:", endpointId);

  // Add manual check logic here later.
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
