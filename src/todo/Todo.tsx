"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = "all" | "active" | "done";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "react_todos";

const INITIAL_TODOS: Todo[] = [
  { id: 1, text: "revisar o projeto", done: false },
  { id: 2, text: "reunião às 15h", done: false },
  { id: 3, text: "ler documentação", done: true },
];

const MONTHS = [
  "jan","fev","mar","abr","mai","jun",
  "jul","ago","set","out","nov","dez",
];
const DAYS = [
  "domingo","segunda","terça","quarta","quinta","sexta","sábado",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Todo[];
  } catch { /* ignore */ }
  return INITIAL_TODOS;
}

function formatDate(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const css = `
  .todo-root {
    font-family: 'Geist', 'Inter', sans-serif;
    --radius: 10px;
    --border: #e4e4e7;
    --bg: #ffffff;
    --bg-muted: #f4f4f5;
    --text: #09090b;
    --text-muted: #71717a;
    --primary: #18181b;
    --primary-fg: #fafafa;
    --destructive: #ef4444;
    --progress-bg: #e4e4e7;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 4px);
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
    overflow: hidden;
  }
  @media (prefers-color-scheme: dark) {
    .todo-root {
      --border: #27272a;
      --bg: #09090b;
      --bg-muted: #18181b;
      --text: #fafafa;
      --text-muted: #71717a;
      --primary: #fafafa;
      --primary-fg: #09090b;
      --destructive: #f87171;
      --progress-bg: #27272a;
    }
  }
  .todo-header { padding: 1.5rem 1.5rem .75rem; }
  .todo-header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .todo-title { font-size: 1.2rem; font-weight: 600; font-family: 'Geist Mono', monospace; letter-spacing: -.4px; }
  .todo-date { font-size: .8125rem; color: var(--text-muted); margin-top: 2px; }
  .todo-badge {
    font-size: .75rem; font-family: monospace; font-weight: 500;
    padding: .2rem .6rem; border-radius: 9999px;
    border: 1px solid var(--border); color: var(--text); white-space: nowrap;
  }
  .todo-progress-wrap { margin-top: 1rem; }
  .todo-progress-labels { display: flex; justify-content: space-between; font-size: .75rem; font-family: monospace; color: var(--text-muted); margin-bottom: 5px; }
  .todo-progress-bar { height: 8px; background: var(--progress-bg); border-radius: 9999px; overflow: hidden; }
  .todo-progress-fill { height: 100%; background: var(--primary); border-radius: 9999px; transition: width .4s cubic-bezier(.4,0,.2,1); }

  .todo-content { padding: .75rem 1.5rem 1.5rem; }

  .todo-input-row { display: flex; gap: 8px; margin-bottom: 1rem; }
  .todo-input {
    flex: 1; height: 2.5rem; padding: 0 .75rem;
    border: 1px solid var(--border); border-radius: var(--radius);
    background: transparent; color: var(--text);
    font-size: .875rem; font-family: inherit;
    outline: none; transition: box-shadow .15s;
  }
  .todo-input::placeholder { color: var(--text-muted); }
  .todo-input:focus { box-shadow: 0 0 0 2px var(--primary); }
  .todo-btn-add {
    width: 2.5rem; height: 2.5rem; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--primary); color: var(--primary-fg);
    border: none; border-radius: var(--radius); cursor: pointer;
    transition: opacity .15s, transform .1s;
  }
  .todo-btn-add:hover { opacity: .85; }
  .todo-btn-add:active { transform: scale(.95); }

  .todo-tabs { display: flex; gap: 2px; background: var(--bg-muted); padding: 3px; border-radius: var(--radius); margin-bottom: .875rem; }
  .todo-tab {
    flex: 1; padding: .35rem 0; border-radius: calc(var(--radius) - 2px);
    font-size: .8125rem; font-weight: 500; font-family: inherit;
    cursor: pointer; border: none; background: transparent; color: var(--text-muted);
    transition: all .15s;
  }
  .todo-tab.active { background: var(--bg); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,.08); }

  .todo-list { max-height: 320px; overflow-y: auto; }
  .todo-list::-webkit-scrollbar { width: 4px; }
  .todo-list::-webkit-scrollbar-track { background: transparent; }
  .todo-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9999px; }

  .todo-sep { height: 1px; background: var(--border); }
  .todo-row {
    display: flex; align-items: center; gap: .75rem;
    padding: .625rem .5rem; border-radius: var(--radius);
    transition: background .12s;
    animation: fadeSlide .18s ease;
  }
  .todo-row:hover { background: var(--bg-muted); }
  @keyframes fadeSlide { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }

  .todo-checkbox {
    width: 1rem; height: 1rem; flex-shrink: 0;
    border: 1.5px solid var(--border); border-radius: 4px;
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .todo-checkbox:hover { border-color: var(--primary); }
  .todo-checkbox.checked { background: var(--primary); border-color: var(--primary); }
  .todo-checkbox svg { width: 10px; height: 10px; color: var(--primary-fg); }

  .todo-text { flex: 1; font-size: .9375rem; line-height: 1.4; word-break: break-word; }
  .todo-text.done { text-decoration: line-through; color: var(--text-muted); }

  .todo-row-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .todo-tag {
    font-size: .7rem; font-family: monospace; padding: .2rem .55rem;
    border-radius: 9999px; background: var(--bg-muted); color: var(--text-muted);
    border: 1px solid var(--border);
  }
  .todo-btn-del {
    width: 2rem; height: 2rem; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; border-radius: var(--radius);
    cursor: pointer; color: var(--text-muted);
    opacity: 0; transition: all .15s;
  }
  .todo-row:hover .todo-btn-del { opacity: 1; }
  .todo-btn-del:hover { background: rgba(239,68,68,.1); color: var(--destructive); }

  .todo-empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
  .todo-empty-icon { font-size: 1.75rem; display: block; margin-bottom: .625rem; opacity: .35; }
  .todo-empty-text { font-size: .875rem; font-family: monospace; }

  .todo-sep-full { height: 1px; background: var(--border); }
  .todo-footer { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }
  .todo-count { font-size: .8125rem; font-family: monospace; color: var(--text-muted); }
  .todo-btn-clear {
    font-size: .8125rem; font-family: monospace; font-weight: 500;
    color: var(--text-muted); background: transparent; border: none;
    cursor: pointer; padding: .25rem .5rem; border-radius: var(--radius);
    transition: all .15s;
  }
  .todo-btn-clear:hover:not(:disabled) { color: var(--destructive); background: rgba(239,68,68,.08); }
  .todo-btn-clear:disabled { opacity: .4; cursor: default; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [nextId, setNextId] = useState<number>(
    () => (todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 10)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch { /* ignore */ }
  }, [todos]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [{ id: nextId, text, done: false }, ...prev]);
    setNextId((n) => n + 1);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTodo = (id: number) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const clearDone = () => setTodos((prev) => prev.filter((t) => !t.done));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTodo();
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const pendingCount = total - doneCount;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>

      <div className="todo-root">
        {/* Header */}
        <div className="todo-header">
          <div className="todo-header-top">
            <div>
              <div className="todo-title">Minhas Tarefas</div>
              <div className="todo-date">{formatDate(new Date())}</div>
            </div>
            <span className="todo-badge">{doneCount}/{total}</span>
          </div>

          <div className="todo-progress-wrap">
            <div className="todo-progress-labels">
              <span>progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="todo-progress-bar">
              <div className="todo-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="todo-content">
          {/* Input */}
          <div className="todo-input-row">
            <input
              ref={inputRef}
              className="todo-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nova tarefa..."
              maxLength={100}
            />
            <button className="todo-btn-add" onClick={addTodo} aria-label="Adicionar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="8" y1="2" x2="8" y2="14" />
                <line x1="2" y1="8" x2="14" y2="8" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="todo-tabs">
            {(["all", "active", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                className={`todo-tab${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "todas" : f === "active" ? "pendentes" : "feitas"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="todo-list">
            {filtered.length === 0 ? (
              <div className="todo-empty">
                <span className="todo-empty-icon">{filter === "done" ? "✓" : "○"}</span>
                <p className="todo-empty-text">
                  {filter === "all" && "nenhuma tarefa ainda"}
                  {filter === "active" && "nada pendente — bom trabalho!"}
                  {filter === "done" && "nenhuma tarefa concluída"}
                </p>
              </div>
            ) : (
              filtered.map((todo, i) => (
                <div key={todo.id}>
                  {i > 0 && <div className="todo-sep" />}
                  <div className="todo-row">
                    <div
                      className={`todo-checkbox${todo.done ? " checked" : ""}`}
                      onClick={() => toggleTodo(todo.id)}
                      role="checkbox"
                      aria-checked={todo.done}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === " " && toggleTodo(todo.id)}
                    >
                      {todo.done && (
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1.5,5 4,7.5 8.5,2.5" />
                        </svg>
                      )}
                    </div>

                    <span className={`todo-text${todo.done ? " done" : ""}`}>
                      {todo.text}
                    </span>

                    <div className="todo-row-right">
                      {todo.done && <span className="todo-tag">feita</span>}
                      <button
                        className="todo-btn-del"
                        onClick={() => removeTodo(todo.id)}
                        aria-label="Remover"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                          stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,3 13,3" />
                          <path d="M5,3V2h4v1" />
                          <path d="M3,3l1,9h6l1-9" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="todo-sep-full" />
        <div className="todo-footer">
          <span className="todo-count">
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
          <button
            className="todo-btn-clear"
            onClick={clearDone}
            disabled={doneCount === 0}
          >
            limpar feitas
          </button>
        </div>
      </div>
    </>
  );
}