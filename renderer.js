// renderer.js

function createPlanner() {
  const planner = document.getElementById("planner");
  const currentHour = new Date().getHours();
  const tasks = JSON.parse(localStorage.getItem("tasks")) || {};

  for (let hour = 0; hour < 24; hour++) {
    const hourBlock = document.createElement("div");
    hourBlock.className = "hour-block";

    if (hour === currentHour) {
      hourBlock.style.backgroundColor = "#ffeb3b"; // Highlight current hour
    }

    const hourLabel = document.createElement("div");
    hourLabel.className = "hour-label";
    hourLabel.textContent = `${hour}:00`;

    const hourInput = document.createElement("input");
    hourInput.className = "hour-input";
    hourInput.type = "text";
    hourInput.placeholder = "Add your task";

    hourInput.value = tasks[hour] || "";

    hourInput.addEventListener("input", () => {
      tasks[hour] = hourInput.value;
      localStorage.setItem("tasks", JSON.stringify(tasks));
    });

    hourBlock.appendChild(hourLabel);
    hourBlock.appendChild(hourInput);
    planner.appendChild(hourBlock);
  }
}

window.onload = createPlanner;
