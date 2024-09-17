// renderer.js

// Cache to store tasks and goals by date
const tasksCache = {};
const goalsCache = {};

async function createPlanner(selectedDate) {
  console.log(
    "renderer.js: createPlanner called with selectedDate:",
    selectedDate
  );

  const planner = document.getElementById("planner");
  const goalInputs = [
    document.getElementById("goal1"),
    document.getElementById("goal2"),
    document.getElementById("goal3"),
  ];

  if (!planner) {
    console.error("renderer.js: Planner element not found.");
    return;
  }

  planner.innerHTML = ""; // Clear existing planner entries

  // Use the selected date as the key
  const d = new Date();
  const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const dateKey = selectedDate || today;

  // Check if tasks for the date are in the cache
  let dailyTasks = tasksCache[dateKey];
  let dailyGoals = goalsCache[dateKey];

  if (dailyTasks && dailyGoals) {
    console.log(`renderer.js: Using cached tasks for date ${dateKey}`);
  } else {
    console.log(`renderer.js: Fetching tasks for date ${dateKey} via IPC`);
    const data = await window.api.getData(dateKey);
    dailyTasks = data.tasks || {};
    dailyGoals = data.goals || ["", "", ""];

    // Store the fetched tasks in the cache
    tasksCache[dateKey] = dailyTasks;
    goalsCache[dateKey] = dailyGoals;
  }

  // Build the UI for the planner
  const fragment = createPlannerUI(dailyTasks, dateKey);
  planner.appendChild(fragment);

  // Load the top 3 goals
  loadGoals(dailyGoals);

  // Add event listeners to the goal inputs
  goalInputs.forEach((input, index) => {
    input.value = dailyGoals[index] || "";

    // Replace any existing event listener with a new one
    input.oninput = () => {
      dailyGoals[index] = input.value;
      goalsCache[dateKey] = dailyGoals;
      window.api.saveData(dateKey, dailyTasks, dailyGoals);
    };
  });

  // Pre-fetch tasks for previous and next dates
  prefetchAdjacentDates(dateKey);
}

function loadGoals(dailyGoals) {
  const goalInputs = [
    document.getElementById("goal1"),
    document.getElementById("goal2"),
    document.getElementById("goal3"),
  ];

  goalInputs.forEach((input, index) => {
    input.value = dailyGoals[index] || "";
  });
}

function createPlannerUI(dailyTasks, dateKey) {
  const fragment = document.createDocumentFragment();
  const currentHour = new Date().getHours();
  const todayKey = new Date().toISOString().split("T")[0];

  for (let hour = 6; hour < 23; hour++) {
    const hourBlock = document.createElement("div");
    hourBlock.className = "hour-block";

    const hourLabel = document.createElement("div");
    hourLabel.className = "hour-label";
    hourLabel.textContent = `${hour}:00`;

    const hourInput = document.createElement("input");
    hourInput.className = "hour-input";
    hourInput.type = "text";
    hourInput.placeholder = "";
    hourInput.value = dailyTasks[hour] || "";

    // Highlight current hour if the selected date is today
    if (dateKey === todayKey && hour === currentHour) {
      hourBlock.classList.add("current-hour");
    } else {
      hourBlock.classList.remove("current-hour");
    }

    hourInput.oninput = () => {
      dailyTasks[hour] = hourInput.value;
      tasksCache[dateKey] = dailyTasks;
      window.api.saveData(dateKey, dailyTasks, dailyGoals);
    };

    hourBlock.appendChild(hourLabel);
    hourBlock.appendChild(hourInput);
    fragment.appendChild(hourBlock);
  }

  return fragment;
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
    const data = await window.api.getData(prevDateKey);
    const prevTasks = data.tasks || {};
    const prevGoals = data.goals || ["", "", ""];
    tasksCache[prevDateKey] = prevTasks;
    goalsCache[prevDateKey] = prevGoals;
  }

  // Fetch next date tasks if not in cache
  if (!tasksCache[nextDateKey]) {
    console.log(`renderer.js: Pre-fetching tasks for next date ${nextDateKey}`);
    const data = await window.api.getData(nextDateKey);
    const nextTasks = data.tasks || {};
    const nextGoals = data.goals || ["", "", ""];
    tasksCache[nextDateKey] = nextTasks;
    goalsCache[nextDateKey] = nextGoals;
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

window.onload = () => {
  console.log("renderer.js: Window onload event fired.");
  setupDatePicker();
};
