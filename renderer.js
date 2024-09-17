// renderer.js


async function createPlanner(selectedDate) {
  const planner = document.getElementById("planner");
  planner.innerHTML = ""; // Clear existing planner entries

  const tasks = JSON.parse(localStorage.getItem("tasks")) || {};

  // Use the selected date as the key
  const d = new Date();
  const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const dateKey = selectedDate || today;

  // Retrieve tasks for the selected date
  const dailyTasks = tasks[dateKey] || {};
  //const dailyTasks = await window.api.getTasks(dateKey);

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

    hourInput.addEventListener("input", () => {
      // Update tasks object
      dailyTasks[hour] = hourInput.value;
      tasks[dateKey] = dailyTasks;
      localStorage.setItem("tasks", JSON.stringify(tasks));
    });

    hourBlock.appendChild(hourLabel);
    hourBlock.appendChild(hourInput);
    planner.appendChild(hourBlock);
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
