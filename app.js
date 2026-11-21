"use strict";

const USERS = [
  { id: 1, name: "María Fernanda Ortega", email: "responsable@negocio.com", pass: "admin123", role: "Responsable" },
  { id: 2, name: "Empleado 1 · Luis Ramírez", email: "emp1@negocio.com", pass: "emp123", role: "Empleado" },
  { id: 3, name: "Empleado 2 · Sofía Morales", email: "emp2@negocio.com", pass: "emp123", role: "Empleado" },
  { id: 4, name: "Empleado 3 · Carlos Mendoza", email: "emp3@negocio.com", pass: "emp123", role: "Empleado" },
];

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nowStamp() {
  return new Date().toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function createInitialState() {
  return {
    currentUserEmail: "responsable@negocio.com",
    activeView: "resumen",
    nextTaskId: 6,
    tasks: [
      {
        id: 1,
        name: "Organizar mercancía de almacén",
        desc: "Clasificar cajas recibidas por categoría y actualizar etiquetas de anaquel.",
        who: "Empleado 1 · Luis Ramírez",
        priority: "Alta",
        due: addDaysISO(1),
        status: "En proceso",
      },
      {
        id: 2,
        name: "Revisar caducidad de productos",
        desc: "Inspeccionar lote semanal en vitrina refrigerada y registrar mermas.",
        who: "Empleado 2 · Sofía Morales",
        priority: "Media",
        due: addDaysISO(2),
        status: "Terminada",
      },
      {
        id: 3,
        name: "Atención a clientes en mostrador",
        desc: "Cubrir turno vespertino de caja, pedidos especiales y cotizaciones.",
        who: "Empleado 3 · Carlos Mendoza",
        priority: "Alta",
        due: addDaysISO(1),
        status: "Pendiente",
      },
      {
        id: 4,
        name: "Limpieza general de área de trabajo",
        desc: "Desinfección de mostradores, pasillos y zona de empaque al cierre.",
        who: "Empleado 1 · Luis Ramírez",
        priority: "Baja",
        due: addDaysISO(3),
        status: "Pendiente",
      },
      {
        id: 5,
        name: "Preparar pedidos para entrega local",
        desc: "Empacar 6 órdenes confirmadas y verificar notas de remisión.",
        who: "Empleado 3 · Carlos Mendoza",
        priority: "Alta",
        due: addDaysISO(2),
        status: "En proceso",
      },
    ],
    history: [
      { date: nowStamp(), task: "Preparar pedidos para entrega local", from: "Pendiente", to: "En proceso", by: "Empleado 3 · Carlos Mendoza" },
      { date: nowStamp(), task: "Revisar caducidad de productos", from: "En proceso", to: "Terminada", by: "Empleado 2 · Sofía Morales" },
      { date: nowStamp(), task: "Organizar mercancía de almacén", from: "Pendiente", to: "En proceso", by: "Empleado 1 · Luis Ramírez" },
    ],
    notifications: [
      { id: 1, to: "responsable@negocio.com", msg: "Empleado 3 · Carlos Mendoza cambió 'Preparar pedidos' a En proceso.", date: nowStamp(), read: false },
      { id: 2, to: "responsable@negocio.com", msg: "Empleado 2 · Sofía Morales marcó como Terminada 'Revisar caducidad de productos'.", date: nowStamp(), read: false },
      { id: 3, to: "emp1@negocio.com", msg: "Tienes asignada la tarea 'Organizar mercancía de almacén' (Prioridad Alta).", date: nowStamp(), read: false },
      { id: 4, to: "emp3@negocio.com", msg: "Recordatorio: 'Atención a clientes en mostrador' vence mañana.", date: nowStamp(), read: false },
    ],
  };
}

const STORAGE_KEY = "gt_app_state_v2";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || createInitialState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  return USERS.find((u) => u.email === state.currentUserEmail) || USERS[0];
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatDateEs(isoDate) {
  if (!isoDate || !isoDate.includes("-")) return isoDate || "—";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function pillClass(value) {
  const map = {
    "Alta": "pill-alta",
    "Media": "pill-media",
    "Baja": "pill-baja",
    "Pendiente": "pill-pendiente",
    "En proceso": "pill-proceso",
    "Terminada": "pill-terminada",
  };
  return map[value] || "";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 3200);
}

function visibleTasksForUser(user) {
  if (user.role === "Responsable") return state.tasks;
  return state.tasks.filter((t) => t.who === user.name);
}

function renderHero() {
  const all = state.tasks;
  const done = all.filter((t) => t.status === "Terminada").length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  document.getElementById("total").textContent = String(all.length);
  document.getElementById("hero-pct").textContent = `● ${pct}% completado`;
  document.getElementById("hero-progress-bar").style.width = `${pct}%`;

  const preview = document.getElementById("hero-preview-rows");
  preview.innerHTML = all.slice(0, 3).map((t) => `
    <div class="mini-row">
      <b>${escapeHtml(t.name)}</b>
      <span class="pill ${pillClass(t.status)}">${escapeHtml(t.status)}</span>
    </div>
  `).join("");
}

function renderApp() {
  const user = getCurrentUser();
  const isResp = user.role === "Responsable";
  const tasks = visibleTasksForUser(user);

  // Sidebar & role indicators
  document.getElementById("sideUserName").textContent = user.name;
  document.getElementById("sideUserRole").textContent = `Rol: ${user.role}`;
  document.getElementById("navTareasBtn").textContent = isResp ? "☷ Tareas" : "☷ Mis tareas";
  document.getElementById("rolePill").textContent = isResp ? "Responsable · Acceso total" : "Empleado · Mis tareas";
  document.getElementById("btnNewTask").hidden = !isResp;
  document.getElementById("thActions").hidden = !isResp;

  const userNotifs = state.notifications.filter((n) => n.to === user.email);
  const unreadCount = userNotifs.filter((n) => !n.read).length;
  document.getElementById("notifBadge").textContent = String(unreadCount);
  document.getElementById("mobNotifCount").textContent = String(unreadCount);

  // Active view switching
  const titles = {
    resumen: [isResp ? "Panel general" : "Mi panel de avance", isResp ? "Seguimiento global de actividades del negocio" : `Actividades asignadas a ${user.name}`],
    tareas: [isResp ? "Gestión de tareas" : "Mis tareas asignadas", isResp ? "Registra, edita, asigna o elimina actividades" : "Consulta tus tareas y actualiza su estado"],
    historial: ["Historial de cambios (HistorialTarea)", "Bitácora automática de transiciones de estado"],
    notificaciones: ["Notificaciones y recordatorios", "Avisos de asignación, cambios y vencimientos"],
  };
  document.getElementById("viewTitle").textContent = titles[state.activeView][0];
  document.getElementById("viewSubtitle").textContent = titles[state.activeView][1];

  document.querySelectorAll(".view-pane").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${state.activeView}`).classList.add("active");
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.activeView);
  });

  // Summary metrics
  const p = tasks.filter((t) => t.status === "Pendiente").length;
  const pr = tasks.filter((t) => t.status === "En proceso").length;
  const d = tasks.filter((t) => t.status === "Terminada").length;
  const pct = tasks.length ? Math.round((d / tasks.length) * 100) : 0;

  document.getElementById("s-total").textContent = String(tasks.length);
  document.getElementById("s-pending").textContent = String(p);
  document.getElementById("s-progress").textContent = String(pr);
  document.getElementById("s-done").textContent = String(d);
  document.getElementById("summaryPct").textContent = `${pct}%`;
  document.getElementById("summaryProgressBar").style.width = `${pct}%`;

  document.getElementById("summaryRows").innerHTML = tasks.length
    ? tasks.map((t) => `
      <tr>
        <td><b>${escapeHtml(t.name)}</b></td>
        <td>${escapeHtml(t.who)}</td>
        <td><span class="pill ${pillClass(t.priority)}">${escapeHtml(t.priority)}</span></td>
        <td>${formatDateEs(t.due)}</td>
        <td><span class="pill ${pillClass(t.status)}">${escapeHtml(t.status)}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">No hay tareas asignadas actualmente.</td></tr>`;

  // Filtered tasks table
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const fs = document.getElementById("filterStatus").value;
  const fp = document.getElementById("filterPriority").value;
  const filtered = tasks.filter((t) => {
    if (fs !== "Todos" && t.status !== fs) return false;
    if (fp !== "Todas" && t.priority !== fp) return false;
    if (q && !(`${t.name} ${t.desc} ${t.who}`.toLowerCase().includes(q))) return false;
    return true;
  });

  document.getElementById("taskRows").innerHTML = filtered.length
    ? filtered.map((t) => `
      <tr>
        <td>
          <strong>${escapeHtml(t.name)}</strong>
          <small>${escapeHtml(t.desc || "Sin descripción adicional")}</small>
        </td>
        <td>${escapeHtml(t.who)}</td>
        <td><span class="pill ${pillClass(t.priority)}">${escapeHtml(t.priority)}</span></td>
        <td>${formatDateEs(t.due)}</td>
        <td>
          <select class="state-select" aria-label="Estado de ${escapeHtml(t.name)}" data-status-id="${t.id}">
            <option ${t.status === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option ${t.status === "En proceso" ? "selected" : ""}>En proceso</option>
            <option ${t.status === "Terminada" ? "selected" : ""}>Terminada</option>
          </select>
        </td>
        ${isResp ? `
          <td>
            <div class="action-group">
              <button type="button" class="btn-secondary btn-sm" data-edit-id="${t.id}">Editar</button>
              <button type="button" class="btn-danger" data-del-id="${t.id}">Eliminar</button>
            </div>
          </td>` : ""}
      </tr>
    `).join("")
    : `<tr><td colspan="${isResp ? 6 : 5}">No hay tareas que coincidan con el filtro aplicado.</td></tr>`;

  // History table
  const hist = isResp
    ? state.history
    : state.history.filter((h) => h.by === user.name || tasks.some((t) => t.name === h.task));
  document.getElementById("historyRows").innerHTML = hist.length
    ? hist.map((h) => `
      <tr>
        <td>${escapeHtml(h.date)}</td>
        <td><strong>${escapeHtml(h.task)}</strong></td>
        <td><span class="pill ${pillClass(h.from)}">${escapeHtml(h.from)}</span></td>
        <td><span class="pill ${pillClass(h.to)}">${escapeHtml(h.to)}</span></td>
        <td>${escapeHtml(h.by)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Aún no hay movimientos registrados.</td></tr>`;

  // Notifications table
  document.getElementById("notifRows").innerHTML = userNotifs.length
    ? userNotifs.map((n) => `
      <tr>
        <td><span class="pill ${n.read ? "pill-baja" : "pill-pendiente"}">${n.read ? "Leída" : "Nueva"}</span></td>
        <td>${escapeHtml(n.msg)}</td>
        <td>${escapeHtml(n.date)}</td>
        <td>${n.read ? "—" : `<button type="button" class="btn-secondary btn-sm" data-read-id="${n.id}">Marcar leída</button>`}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">No tienes notificaciones registradas.</td></tr>`;

  saveState();
  renderHero();
}

// Navigation
document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeView = btn.dataset.view;
    renderApp();
  });
});

// Filters
["searchInput", "filterStatus", "filterPriority"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderApp);
  document.getElementById(id).addEventListener("change", renderApp);
});

// Modals open/close
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

// Login / Role switching
function openLoginModal() {
  const user = getCurrentUser();
  document.getElementById("loginEmail").value = user.email;
  document.getElementById("loginPass").value = user.pass;
  document.getElementById("loginError").hidden = true;
  openModal("loginModal");
}

document.getElementById("btnOpenLogin").addEventListener("click", openLoginModal);
document.getElementById("btnOpenLoginMob").addEventListener("click", openLoginModal);

document.querySelectorAll("[data-quick-login]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [email, pass] = btn.dataset.quickLogin.split("|");
    state.currentUserEmail = email;
    closeModal("loginModal");
    renderApp();
    showToast(`Sesión iniciada como ${getCurrentUser().name}`);
  });
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;
  const found = USERS.find((u) => u.email === email && u.pass === pass);
  const errEl = document.getElementById("loginError");
  if (!found) {
    errEl.textContent = "Credenciales inválidas. Usa los accesos de demostración.";
    errEl.hidden = false;
    return;
  }
  state.currentUserEmail = found.email;
  closeModal("loginModal");
  renderApp();
  showToast(`Sesión iniciada: ${found.name} (${found.role})`);
});

// Create / Edit Task
document.getElementById("btnNewTask").addEventListener("click", () => {
  document.getElementById("taskModalTitle").textContent = "Registrar nueva tarea";
  document.getElementById("btnSaveTask").textContent = "Guardar tarea";
  document.getElementById("editingTaskId").value = "";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskAssignee").selectedIndex = 0;
  document.getElementById("taskPriority").value = "Media";
  document.getElementById("taskDue").value = addDaysISO(2);
  openModal("taskModal");
});

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (user.role !== "Responsable") return;

  const editId = document.getElementById("editingTaskId").value;
  const name = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const who = document.getElementById("taskAssignee").value;
  const priority = document.getElementById("taskPriority").value;
  const due = document.getElementById("taskDue").value;
  if (!name) return;

  const assigneeUser = USERS.find((u) => u.name === who);
  if (editId) {
    const t = state.tasks.find((item) => item.id === Number(editId));
    if (t) {
      t.name = name;
      t.desc = desc;
      t.who = who;
      t.priority = priority;
      t.due = due;
      showToast(`Tarea '${name}' actualizada.`);
    }
  } else {
    state.tasks.unshift({ id: state.nextTaskId++, name, desc, who, priority, due, status: "Pendiente" });
    if (assigneeUser) {
      state.notifications.unshift({
        id: Date.now(),
        to: assigneeUser.email,
        msg: `Nueva tarea asignada: '${name}' (Prioridad ${priority}, límite ${formatDateEs(due)}).`,
        date: nowStamp(),
        read: false,
      });
    }
    showToast(`Tarea '${name}' registrada y notificada.`);
  }

  closeModal("taskModal");
  state.activeView = "tareas";
  renderApp();
});

// Table interactions: state change, edit, delete
document.getElementById("taskRows").addEventListener("change", (e) => {
  const id = e.target.dataset.statusId;
  if (!id) return;
  const t = state.tasks.find((item) => item.id === Number(id));
  if (!t || t.status === e.target.value) return;

  const prev = t.status;
  const next = e.target.value;
  const user = getCurrentUser();
  t.status = next;

  state.history.unshift({
    date: nowStamp(),
    task: t.name,
    from: prev,
    to: next,
    by: user.name,
  });

  const targetUser = user.role === "Responsable"
    ? USERS.find((u) => u.name === t.who)
    : USERS.find((u) => u.role === "Responsable");
  if (targetUser) {
    state.notifications.unshift({
      id: Date.now(),
      to: targetUser.email,
      msg: `${user.name} cambió '${t.name}' de ${prev} a ${next}.`,
      date: nowStamp(),
      read: false,
    });
  }

  renderApp();
  showToast(`Estado actualizado (${prev} → ${next}) y registrado en historial.`);
});

document.getElementById("taskRows").addEventListener("click", (e) => {
  const editId = e.target.dataset.editId;
  const delId = e.target.dataset.delId;

  if (editId) {
    const t = state.tasks.find((item) => item.id === Number(editId));
    if (!t) return;
    document.getElementById("taskModalTitle").textContent = "Editar tarea";
    document.getElementById("btnSaveTask").textContent = "Guardar cambios";
    document.getElementById("editingTaskId").value = String(t.id);
    document.getElementById("taskTitle").value = t.name;
    document.getElementById("taskDesc").value = t.desc || "";
    document.getElementById("taskAssignee").value = t.who;
    document.getElementById("taskPriority").value = t.priority;
    document.getElementById("taskDue").value = t.due;
    openModal("taskModal");
  }

  if (delId) {
    const t = state.tasks.find((item) => item.id === Number(delId));
    if (!t) return;
    state.tasks = state.tasks.filter((item) => item.id !== Number(delId));
    renderApp();
    showToast(`Tarea '${t.name}' eliminada.`);
  }
});

// Notifications actions
document.getElementById("notifRows").addEventListener("click", (e) => {
  const readId = e.target.dataset.readId;
  if (!readId) return;
  const n = state.notifications.find((item) => item.id === Number(readId));
  if (n) n.read = true;
  renderApp();
});

document.getElementById("btnReadAllNotifs").addEventListener("click", () => {
  const user = getCurrentUser();
  state.notifications.forEach((n) => {
    if (n.to === user.email) n.read = true;
  });
  renderApp();
  showToast("Notificaciones marcadas como leídas.");
});

document.getElementById("btnGenReminders").addEventListener("click", () => {
  const limit = addDaysISO(2);
  let created = 0;
  state.tasks.forEach((t) => {
    if (t.status === "Terminada" || t.due > limit) return;
    const target = USERS.find((u) => u.name === t.who);
    if (!target) return;
    const msg = `Recordatorio: '${t.name}' vence el ${formatDateEs(t.due)}.`;
    if (!state.notifications.some((n) => n.to === target.email && n.msg === msg)) {
      state.notifications.unshift({ id: Date.now() + created, to: target.email, msg, date: nowStamp(), read: false });
      created += 1;
    }
  });
  renderApp();
  showToast(created ? `Se generaron ${created} recordatorio(s).` : "No hay nuevos recordatorios próximos a vencer.");
});

document.getElementById("btnResetDemo").addEventListener("click", () => {
  state = createInitialState();
  renderApp();
  showToast("Datos de demostración restaurados.");
});

// Desktop screenshot tabs
const DESKTOP_SCREENS = {
  "01_login": [
    "assets/capturas/01_login.png",
    "Pantalla 1 · Inicio de sesión con validación de rol",
    "Autentica al usuario mediante correo y contraseña con hash, identificando si pertenece al rol Responsable o Empleado."
  ],
  "02_panel_responsable": [
    "assets/capturas/02_panel_responsable.png",
    "Pantalla 2 · Panel principal del Responsable",
    "Presenta métricas en tiempo real (Total, Pendientes, En proceso, Terminadas), barra de cumplimiento y tabla prioritaria."
  ],
  "03_registrar_tarea": [
    "assets/capturas/03_registrar_tarea.png",
    "Pantalla 3 · Registro y edición de tareas",
    "Formulario modal con título, descripción, empleado responsable, prioridad y fecha límite con calendario."
  ],
  "04_mis_tareas_empleado": [
    "assets/capturas/04_mis_tareas_empleado.png",
    "Pantalla 4 · Vista de Empleado (Mis tareas)",
    "Restringe los botones administrativos de alta/edición/eliminación y muestra únicamente las tareas asignadas al empleado."
  ],
  "05_historial_notificaciones": [
    "assets/capturas/05_historial_notificaciones.png",
    "Pantalla 5 · Historial de cambios y Centro de notificaciones",
    "Muestra el registro automático de transiciones de estado y los avisos/recordatorios pendientes por leer."
  ],
};

document.querySelectorAll("[data-screen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-screen]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const [src, title, desc] = DESKTOP_SCREENS[btn.dataset.screen];
    const img = document.getElementById("desktopPreviewImg");
    img.src = src;
    img.alt = title;
    document.getElementById("desktopPreviewTitle").textContent = title;
    document.getElementById("desktopPreviewDesc").textContent = desc;
  });
});

// Diagram tabs
const DIAGRAMS = {
  "uml_casos_de_uso": [
    "assets/diagramas/uml_casos_de_uso.svg",
    "Diagrama de Casos de Uso (UML 2.5.1)",
    "Conecta ambos actores con sus acciones reales. 'Actualizar estado' incluye obligatoriamente 'Registrar cambio en historial' y notifica al Responsable."
  ],
  "uml_clases": [
    "assets/diagramas/uml_clases.svg",
    "Diagrama de Clases (UML 2.5.1 — POO)",
    "Clase abstracta Usuario con herencia hacia Responsable y Empleado, enumeraciones tipadas y composición con HistorialTarea."
  ],
  "diagrama_flujo": [
    "assets/diagramas/diagrama_flujo.svg",
    "Diagrama de Flujo del Proceso Principal (con carriles)",
    "Separa responsabilidades en Responsable, Sistema y Empleado con inicio/fin explícitos, bucle de error de acceso y registro de historial."
  ],
  "uml_secuencia": [
    "assets/diagramas/uml_secuencia.svg",
    "Diagrama de Secuencia (UML 2.5.1)",
    "Muestra el intercambio cronológico de mensajes desde el inicio de sesión y asignación hasta la consulta final de avance."
  ],
};

document.querySelectorAll("[data-diag]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-diag]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const [src, title, desc] = DIAGRAMS[btn.dataset.diag];
    const img = document.getElementById("diagramPreviewImg");
    img.src = src;
    img.alt = title;
    document.getElementById("diagramPreviewTitle").textContent = title;
    document.getElementById("diagramPreviewDesc").textContent = desc;
  });
});

renderApp();
