const zone = "America/Caracas";
const selectedDate = document.querySelector("#selected-date");
const agendaCaption = document.querySelector("#agenda-caption");
const todayButton = document.querySelector("#today-button");

function dateKeyNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function moveDate(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function labelDate(dateKey) {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

const today = dateKeyNow();
let activeDate = today;

function renderDate() {
  const label = labelDate(activeDate);
  selectedDate.dateTime = activeDate;
  selectedDate.textContent = label.charAt(0).toLocaleUpperCase("es-VE") + label.slice(1);
  agendaCaption.textContent = activeDate === today ? "Consultas programadas para hoy" : `Consultas programadas · ${label}`;
  todayButton.hidden = activeDate === today;
}

document.querySelector("#previous-day").addEventListener("click", () => {
  activeDate = moveDate(activeDate, -1);
  renderDate();
});
document.querySelector("#next-day").addEventListener("click", () => {
  activeDate = moveDate(activeDate, 1);
  renderDate();
});
todayButton.addEventListener("click", () => {
  activeDate = today;
  renderDate();
});
renderDate();

const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector(".menu-toggle");
const backdrop = document.createElement("button");
backdrop.className = "sidebar-backdrop";
backdrop.type = "button";
backdrop.setAttribute("aria-label", "Cerrar navegación");
document.body.append(backdrop);

function setMenu(open) {
  sidebar.classList.toggle("open", open);
  backdrop.classList.toggle("visible", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar navegación" : "Abrir navegación");
}

menuToggle.addEventListener("click", () => setMenu(!sidebar.classList.contains("open")));
backdrop.addEventListener("click", () => setMenu(false));
sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});
