// store.js
export const store = {
    key: "cloud_todo_guest",
    setKey(newKey) { this.key = newKey; },
    load() {
        try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
        catch { return null; }
    },
    save(state) { localStorage.setItem(this.key, JSON.stringify(state)); }
};
