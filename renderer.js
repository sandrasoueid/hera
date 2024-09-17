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
  } = dailyData;

  // Build the UI for the planner
  const fragment = createPlannerUI(dailyTasks, dateKey);
  planner.appendChild(fragment);

  // Load the top 3 goals
  loadGoals(dailyGoals, dateKey);

  loadTodos(dailyTodos, dateKey, dailyData);

  // Pre-fetch data for previous and next dates
  prefetchAdjacentDates(dateKey);
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

function loadTodos(dailyTodos, dateKey, dailyData) {
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
    createTodoItem(i, dailyTodos, dateKey, dailyData);
  }
}

function createTodoItem(index, dailyTodos, dateKey, dailyData) {
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
  textInput.placeholder = `Todo Item ${index + 1}`;

  // Event Listeners
  checkbox.onchange = () => {
    dailyTodos[index].completed = checkbox.checked;
    if (checkbox.checked) {
      todoItemDiv.classList.add("completed");
    } else {
      todoItemDiv.classList.remove("completed");
    }
    saveData(dateKey, dailyData);
  };

  textInput.oninput = () => {
    dailyTodos[index].text = textInput.value;
    saveData(dateKey, dailyData);
  };

  todoItemDiv.appendChild(checkbox);
  todoItemDiv.appendChild(textInput);
  todoItemsContainer.appendChild(todoItemDiv);
}

window.onload = () => {
  console.log("renderer.js: Window onload event fired.");
  setupDatePicker();
};
