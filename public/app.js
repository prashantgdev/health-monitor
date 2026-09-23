const endpointList = document.getElementById("endpointList");

const totalCount = document.getElementById("totalCount");

const upCount = document.getElementById("upCount");

const downCount = document.getElementById("downCount");

const modal = document.getElementById("modal");

const addButton = document.getElementById("addButton");

const emptyAddButton = document.getElementById("emptyAddButton");

const closeModal = document.getElementById("closeModal");

const cancelButton = document.getElementById("cancelButton");

const modalBackdrop = document.getElementById("modalBackdrop");

const monitorForm = document.getElementById("monitorForm");

const urlInput = document.getElementById("url");

const intervalInput = document.getElementById("interval");

const formError = document.getElementById("formError");

const refreshButton = document.getElementById("refreshButton");

const customInterval = document.getElementById("customInterval");

const customIntervalValue = document.getElementById("customIntervalValue");

const customIntervalUnit = document.getElementById("customIntervalUnit");

intervalInput.addEventListener("change", () => {
  const isCustom = intervalInput.value === "custom";

  customInterval.classList.toggle("hidden", !isCustom);

  if (isCustom) {
    setTimeout(() => {
      customIntervalValue.focus();
    }, 50);
  }
});

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

function openModal() {
  modal.classList.remove("hidden");

  setTimeout(() => {
    urlInput.focus();
  }, 50);
}

// function closeModalWindow() {
//   modal.classList.add("hidden");

//   monitorForm.reset();

//   formError.classList.add("hidden");

//   formError.textContent = "";
// }
function closeModalWindow() {
  modal.classList.add("hidden");

  monitorForm.reset();

  customInterval.classList.add("hidden");
  customIntervalValue.value = "";
  customIntervalUnit.value = "minutes";

  formError.classList.add("hidden");
  formError.textContent = "";
}

addButton.addEventListener("click", openModal);

emptyAddButton.addEventListener("click", openModal);

closeModal.addEventListener("click", closeModalWindow);

cancelButton.addEventListener("click", closeModalWindow);

modalBackdrop.addEventListener("click", closeModalWindow);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInterval(seconds) {
  if (seconds < 60) {
    return `Every ${seconds} seconds`;
  }

  const minutes = seconds / 60;

  if (minutes === 1) {
    return "Every 1 minute";
  }

  return `Every ${minutes} minutes`;
}

function formatDate(date) {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleString();
}

function formatResponseTime(ms) {
  if (ms === null || ms === undefined) {
    return "-";
  }

  return `${ms} ms`;
}

function getStatusText(status) {
  if (status === "up") {
    return "Healthy";
  }

  if (status === "down") {
    return "Down";
  }

  return "Checking";
}

/*
|--------------------------------------------------------------------------
| Load monitors
|--------------------------------------------------------------------------
*/

async function loadMonitors() {
  try {
    const response = await fetch("/api/monitors");

    if (!response.ok) {
      throw new Error();
    }

    const monitors = await response.json();

    renderStats(monitors);

    renderMonitors(monitors);
  } catch {
    endpointList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          !
        </div>

        <h3>
          Unable to load monitors
        </h3>

        <p>
          The monitor server may be unavailable.
        </p>

      </div>
    `;
  }
}

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

function renderStats(monitors) {
  const total = monitors.length;

  const up = monitors.filter((monitor) => monitor.status === "up").length;

  const down = monitors.filter((monitor) => monitor.status === "down").length;

  totalCount.textContent = total;

  upCount.textContent = up;

  downCount.textContent = down;
}

/*
|--------------------------------------------------------------------------
| Render monitor list
|--------------------------------------------------------------------------
*/

function renderMonitors(monitors) {
  if (monitors.length === 0) {
    endpointList.innerHTML = `
      <div class="empty-state">

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

      </div>
    `;

    return;
  }

  endpointList.innerHTML = monitors.map(createMonitorHtml).join("");
}

/*
|--------------------------------------------------------------------------
| Monitor card
|--------------------------------------------------------------------------
*/

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

        <div class="monitor-url">

          ${escapeHtml(monitor.url)}

        </div>


        <div class="monitor-meta">

          <span>
            HTTP:
            ${monitor.statusCode ?? "-"}
          </span>

          <span>
            Response:
            ${formatResponseTime(monitor.responseTime)}
          </span>

          <span>
            ${formatInterval(monitor.interval)}
          </span>

          <span>
            Last checked:
            ${formatDate(monitor.lastChecked)}
          </span>

        </div>

      </div>


      <span
        class="status-badge ${status}"
      >
        ${getStatusText(monitor.status)}
      </span>


      <button
        class="delete-button"
        title="Delete endpoint"
        onclick="deleteMonitor('${monitor.id}')"
      >
        ×
      </button>

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| Add monitor
|--------------------------------------------------------------------------
*/

monitorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();

  // const interval = Number(intervalInput.value);
  let interval;

  if (intervalInput.value === "custom") {
    const value = Number(customIntervalValue.value);

    if (!Number.isInteger(value) || value < 1) {
      showFormError("Please enter a valid custom interval.");

      return;
    }

    interval = customIntervalUnit.value === "minutes" ? value * 60 : value;

    if (interval < 10) {
      showFormError("Custom interval must be at least 10 seconds.");

      return;
    }
  } else {
    interval = Number(intervalInput.value);
  }

  formError.classList.add("hidden");

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

  try {
    const response = await fetch("/api/monitors", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
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

/*
|--------------------------------------------------------------------------
| Delete monitor
|--------------------------------------------------------------------------
*/

async function deleteMonitor(id) {
  const confirmed = confirm("Remove this endpoint from monitoring?");

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/monitors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error();
    }

    await loadMonitors();
  } catch {
    alert("Unable to remove the endpoint.");
  }
}

/*
|--------------------------------------------------------------------------
| Refresh
|--------------------------------------------------------------------------
*/

refreshButton.addEventListener("click", async () => {
  refreshButton.disabled = true;

  refreshButton.textContent = "Refreshing...";

  await loadMonitors();

  refreshButton.disabled = false;

  refreshButton.textContent = "↻ Refresh";
});

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

loadMonitors();

/*
 * Refresh the dashboard every 5 seconds.
 *
 * This only refreshes the UI.
 * The actual health checks are performed
 * by server.js.
 */

setInterval(loadMonitors, 5000);
