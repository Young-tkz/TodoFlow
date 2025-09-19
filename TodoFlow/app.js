// app.js  — localStorage version (no Firestore)
import { store } from "./store.js";
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "./firebase.js";

/* -------------------- STATE + HELPERS -------------------- */
const state = { tasks: [], filter: "all" }; // no uid/unsub needed

function setState(patch) {
    Object.assign(state, patch);
    store.save(state);   // persist to localStorage
    render();
}

function fmt(ts) { return new Date(ts).toLocaleString(); }

function prioBadge(p) {
    if (!p) return "";
    const color = p === "high" ? "red" : p === "med" ? "yellow" : "emerald";
    return `<span class="ml-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-300 ring-1 ring-${color}-500/20">${p}</span>`;
}

function TaskItem(task, i) {
    const li = document.createElement("li");
    li.className = "group flex items-start justify-between rounded-xl bg-slate-900/50 ring-1 ring-white/10 p-3 mb-2";
    li.innerHTML = `
    <label class="flex items-start gap-3">
      <input data-action="toggle" data-i="${i}" type="checkbox" ${task.done ? "checked" : ""} class="mt-1 size-5 accent-emerald-500">
      <span>
        <span class="${task.done ? "line-through opacity-60" : ""}">${task.title}</span>
        ${prioBadge(task.priority)}
        <span class="block text-[11px] text-slate-400 mt-1">
          Created: ${fmt(task.createdAt)} • Updated: ${fmt(task.updatedAt)}
        </span>
      </span>
    </label>
    <button data-action="delete" data-i="${i}" class="opacity-60 hover:opacity-100">✕</button>
  `;
    return li;
}

function render() {
    const listEl    = document.getElementById("list");
    const countsEl  = document.getElementById("counts");
    const progEl    = document.getElementById("progress");
    const filterBar = document.getElementById("filters");

    const visible = state.filter === "all"
        ? state.tasks
        : state.tasks.filter(t => state.filter === "active" ? !t.done : t.done);

    listEl.replaceChildren();
    visible.forEach((t, i) => listEl.appendChild(TaskItem(t, i)));

    const total  = state.tasks.length;
    const done   = state.tasks.filter(t => t.done).length;
    const active = total - done;
    countsEl.textContent = `Total: ${total} • Active: ${active} • Completed: ${done}`;
    progEl.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;

    [...filterBar.querySelectorAll("button")].forEach(btn => {
        const isActive = btn.dataset.filter === state.filter;
        btn.className = `px-3 py-1 rounded-lg ${isActive ? "bg-slate-800" : "hover:bg-slate-800"}`;
    });
}

/* -------------------- EVENTS (localStorage writes) -------------------- */
document.getElementById("newTask").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const priority = document.getElementById("prio").value;
    if (!title) return;
    const now = Date.now();
    const task = { title, priority, done: false, createdAt: now, updatedAt: now };
    setState({ tasks: [task, ...state.tasks] });
    e.target.reset();
});

document.addEventListener("click", (e) => {
    const filterBtn = e.target.closest("[data-filter]");
    if (filterBtn) return setState({ filter: filterBtn.dataset.filter });

    const delBtn = e.target.closest("[data-action='delete']");
    if (delBtn) {
        const i = +delBtn.dataset.i;
        const tasks = [...state.tasks]; tasks.splice(i, 1);
        return setState({ tasks });
    }

    const toggle = e.target.closest("[data-action='toggle']");
    if (toggle) {
        const i = +toggle.dataset.i;
        const tasks = state.tasks.map((t, idx) =>
            idx === i ? { ...t, done: !t.done, updatedAt: Date.now() } : t
        );
        return setState({ tasks });
    }

    if (e.target.id === "clearDone") {
        return setState({ tasks: state.tasks.filter(t => !t.done) });
    }

    if (e.target.id === "markAll") {
        const now = Date.now();
        return setState({ tasks: state.tasks.map(t => ({ ...t, done: true, updatedAt: now })) });
    }
});

/* -------------------- AUTH GATING (keep auth, storage per user) -------------------- */
const authSection = document.getElementById("authSection");
const appMain     = document.getElementById("appMain");
const emailInput  = document.getElementById("email");
const passInput   = document.getElementById("password");
const navbar       = document.getElementById("navbar");


document.getElementById("signupBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    try { await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value); }
    catch (err) { alert(err.message); }
});

document.getElementById("loginBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, emailInput.value, passInput.value); }
    catch (err) { alert(err.message); }
});

/* 👇 Place this logout listener here */
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
});

/* If you also added a navbar logout button (#logoutBtnNav), add its listener here too */
document.getElementById("logoutBtnNav").addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
});

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // ✅ Logged in
        authSection.classList.add("hidden");
        appMain.classList.remove("hidden");
        navbar.classList.remove("hidden");

        document.getElementById("logoutBtn").classList.remove("hidden");
        document.getElementById("logoutBtnNav").classList.remove("hidden");

        // per-user local storage namespace
        store.setKey(`cloud_todo_${user.uid}`);
        const saved = store.load();
        if (saved) Object.assign(state, saved);
        render();

    } else {
        // ❌ Logged out
        appMain.classList.add("hidden");
        authSection.classList.remove("hidden");
        navbar.classList.add("hidden");

        document.getElementById("logoutBtn").classList.add("hidden");
        document.getElementById("logoutBtnNav").classList.add("hidden");

        // optional guest storage
        store.setKey("cloud_todo_guest");
        const guest = store.load();
        if (guest) Object.assign(state, guest);

        render();
    }
});