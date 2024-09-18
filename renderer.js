// renderer.js

// Cache to store daily data by date
const dailyCache = {};

async function createPlanner(selectedDate) {
  console.log(
    "renderer.js: createPlanner called with selectedDate:",
    selectedDate
  );

  const planner = document.getElementById("planner");

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

  // Check if data for the date is in the cache
  let dailyData = dailyCache[dateKey];

  if (dailyData) {
    console.log(`renderer.js: Using cached data for date ${dateKey}`);
  } else {
    console.log(`renderer.js: Fetching data for date ${dateKey} via IPC`);
    const data = await window.api.getData(dateKey);
    dailyData = data || {
      tasks: {},
      goals: ["", "", ""],
      todos: Array.from({ length: 8 }, () => ({ text: "", completed: false })),
      meals: "",
      waterIntake: Array(8).fill(false),
      notes: "",
    };

    // Store the fetched data in the cache
    dailyCache[dateKey] = dailyData;
  }

  const {
    tasks: dailyTasks,
    goals: dailyGoals,
    todos: dailyTodos,
    meals: dailyMeals,
    waterIntake: dailyWaterIntake,
    notes: dailyNotes,
  } = dailyData;

  // Build the UI for the planner
  const fragment = createPlannerUI(dailyTasks, dateKey, today);
  planner.appendChild(fragment);

  loadGoals(dailyGoals, dateKey);
  loadTodos(dailyTodos, dateKey);
  loadMeals(dailyMeals, dateKey);
  loadNotes(dailyNotes, dateKey);
  loadWaterIntake(dailyWaterIntake, dateKey);

  // Pre-fetch data for previous and next dates
  prefetchAdjacentDates(dateKey);
}

function loadMeals(dailyMeals, dateKey) {
  const mealsInput = document.getElementById("meals");
  mealsInput.value = dailyMeals || "";

  mealsInput.oninput = () => {
    dailyCache[dateKey].meals = mealsInput.value;
    window.api.saveData(dateKey, dailyCache[dateKey]);
  };
}

function loadNotes(dailyNotes, dateKey) {
  const notesInput = document.getElementById("notes");
  notesInput.value = dailyNotes || "";

  notesInput.oninput = () => {
    dailyCache[dateKey].notes = notesInput.value;
    window.api.saveData(dateKey, dailyCache[dateKey]);
  };
}

function loadWaterIntake(dailyWaterIntake, dateKey, dailyData) {
  const waterCheckboxesContainer = document.getElementById("waterCheckboxes");
  waterCheckboxesContainer.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = dailyWaterIntake[i];

    checkbox.onchange = () => {
      dailyWaterIntake[i] = checkbox.checked;
      dailyCache[dateKey].waterIntake = dailyWaterIntake;
      window.api.saveData(dateKey, dailyCache[dateKey]);
    };

    label.appendChild(checkbox);
    waterCheckboxesContainer.appendChild(label);
  }
}

function loadGoals(dailyGoals, dateKey) {
  const goalInputs = [
    document.getElementById("goal1"),
    document.getElementById("goal2"),
    document.getElementById("goal3"),
  ];

  goalInputs.forEach((input, index) => {
    input.value = dailyGoals[index] || "";

    // Replace any existing event listener with a new one
    input.oninput = () => {
      dailyGoals[index] = input.value;
      dailyCache[dateKey].goals = dailyGoals;
      window.api.saveData(dateKey, dailyCache[dateKey]);
    };
  });
}

function createPlannerUI(dailyTasks, dateKey, todayKey) {
  const fragment = document.createDocumentFragment();
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
      dailyCache[dateKey].tasks = dailyTasks;
      window.api.saveData(dateKey, dailyCache[dateKey]);
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

  // Fetch previous date data if not in cache
  if (!dailyCache[prevDateKey]) {
    console.log(
      `renderer.js: Pre-fetching data for previous date ${prevDateKey}`
    );
    const data = await window.api.getData(prevDateKey);
    dailyCache[prevDateKey] = data || {
      tasks: {},
      goals: ["", "", ""],
      todos: Array.from({ length: 8 }, () => ({ text: "", completed: false })),
      meals: "",
      waterIntake: Array(8).fill(false),
      notes: "",
    };
  }

  // Fetch next date data if not in cache
  if (!dailyCache[nextDateKey]) {
    console.log(`renderer.js: Pre-fetching data for next date ${nextDateKey}`);
    const data = await window.api.getData(nextDateKey);
    dailyCache[nextDateKey] = data || {
      tasks: {},
      goals: ["", "", ""],
      todos: Array.from({ length: 8 }, () => ({ text: "", completed: false })),
      meals: "",
      waterIntake: Array(8).fill(false),
      notes: "",
    };
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

function loadTodos(dailyTodos, dateKey) {
  const todoItemsContainer = document.getElementById("todoItems");
  todoItemsContainer.innerHTML = ""; // Clear any existing items

  // Ensure dailyTodos is an array of 8 items
  if (!dailyTodos || dailyTodos.length !== 8) {
    dailyTodos = Array.from({ length: 8 }, () => ({
      text: "",
      completed: false,
    }));
    dailyData.todos = dailyTodos;
  }

  for (let i = 0; i < 8; i++) {
    createTodoItem(i, dailyTodos, dateKey);
  }
}

function createTodoItem(index, dailyTodos, dateKey) {
  const todoItemsContainer = document.getElementById("todoItems");

  const todoItemDiv = document.createElement("div");
  todoItemDiv.className = "todo-item";
  if (dailyTodos[index].completed) {
    todoItemDiv.classList.add("completed");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = dailyTodos[index].completed;

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = dailyTodos[index].text;

  // Event Listeners
  checkbox.onchange = () => {
    dailyTodos[index].completed = checkbox.checked;
    dailyCache[dateKey].todos = dailyTodos;
    if (checkbox.checked) {
      todoItemDiv.classList.add("completed");
    } else {
      todoItemDiv.classList.remove("completed");
    }
    window.api.saveData(dateKey, dailyCache[dateKey]);
  };

  textInput.oninput = () => {
    dailyTodos[index].text = textInput.value;
    dailyCache[dateKey].todos = dailyTodos;
    window.api.saveData(dateKey, dailyCache[dateKey]);
  };

  todoItemDiv.appendChild(checkbox);
  todoItemDiv.appendChild(textInput);
  todoItemsContainer.appendChild(todoItemDiv);
}

window.onload = () => {
  console.log("renderer.js: Window onload event fired.");
  setupDatePicker();
};
