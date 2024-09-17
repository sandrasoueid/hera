// renderer.js
const { ipcRenderer } = window.electron;

// Cache to store tasks by date
const tasksCache = {};

async function createPlanner(selectedDate) {
  const planner = document.getElementById("planner");
  planner.innerHTML = ""; // Clear existing planner entries

  // Use the selected date as the key
  const d = new Date();
  const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const dateKey = selectedDate || today;

  // Check if tasks for the date are in the cache
  let dailyTasks = tasksCache[dateKey];
  if (dailyTasks) {
    console.log(`renderer.js: Using cached tasks for date ${dateKey}`);
  } else {
    console.log(`renderer.js: Fetching tasks for date ${dateKey} via IPC`);
    dailyTasks = await ipcRenderer.invoke("get-tasks", dateKey);
    // Store the fetched tasks in the cache
    tasksCache[dateKey] = dailyTasks;
  }

  // Pre-fetch tasks for previous and next dates
  prefetchAdjacentDates(dateKey);

  const currentHour = new Date().getHours();

  for (let hour = 6; hour < 23; hour++) {
    const hourBlock = document.createElement("div");
    hourBlock.className = "hour-block";

    const hourLabel = document.createElement("div");
    hourLabel.className = "hour-label";
    hourLabel.textContent = `${hour}:00`;

    const hourInput = document.createElement("input");
    hourInput.className = "hour-input";
    hourInput.type = "text";
    hourInput.placeholder = "Add your task";
    hourInput.value = dailyTasks[hour] || "";

    // Highlight current hour if the selected date is today

    if (dateKey === today && hour === currentHour) {
      hourBlock.style.backgroundColor = "#ffeb3b"; // Highlight current hour
    }

    hourInput.addEventListener("input", async () => {
      // Update tasks object
      dailyTasks[hour] = hourInput.value;
      await ipcRenderer.invoke("save-tasks", dateKey, dailyTasks);
    });

    hourBlock.appendChild(hourLabel);
    hourBlock.appendChild(hourInput);
    planner.appendChild(hourBlock);
  }
}

async function prefetchAdjacentDates(currentDateKey) {
  const date = new Date(currentDateKey);
  const prevDate = new Date(date);
  const nextDate = new Date(date);

  prevDate.setDate(date.getDate() - 1);
  nextDate.setDate(date.getDate() + 1);

  const prevDateKey = prevDate.toISOString().split("T")[0];
  const nextDateKey = nextDate.toISOString().split("T")[0];

  // Fetch previous date tasks if not in cache
  if (!tasksCache[prevDateKey]) {
    console.log(
      `renderer.js: Pre-fetching tasks for previous date ${prevDateKey}`
    );
    const prevTasks = await ipcRenderer.invoke("get-tasks", prevDateKey);
    tasksCache[prevDateKey] = prevTasks;
  }

  // Fetch next date tasks if not in cache
  if (!tasksCache[nextDateKey]) {
    console.log(`renderer.js: Pre-fetching tasks for next date ${nextDateKey}`);
    const nextTasks = await ipcRenderer.invoke("get-tasks", nextDateKey);
    tasksCache[nextDateKey] = nextTasks;
  }
}

function setupDatePicker() {
  const datePicker = document.getElementById("datePicker");
  const prevDateBtn = document.getElementById("prevDate");
  const nextDateBtn = document.getElementById("nextDate");
  const d = new Date();
  const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  datePicker.value = today;

  // Initialize planner with today's date
  createPlanner(today);

  datePicker.addEventListener("change", () => {
    const selectedDate = datePicker.value;
    createPlanner(selectedDate);
  });

  prevDateBtn.addEventListener("click", () => {
    let currentDate = new Date(datePicker.value);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split("T")[0];
    datePicker.value = newDate;
    createPlanner(newDate);
  });

  nextDateBtn.addEventListener("click", () => {
    let currentDate = new Date(datePicker.value);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split("T")[0];
    datePicker.value = newDate;
    createPlanner(newDate);
  });
}

window.onload = setupDatePicker;
