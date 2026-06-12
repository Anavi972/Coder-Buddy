// app.js – Core logic for Colorful Todo (ES module)

// Export filter constants
export const FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

// Todo model
class Todo {
  /**
   * @param {number|string} id
   * @param {string} text
   * @param {boolean} [completed=false]
   */
  constructor(id, text, completed = false) {
    this.id = id;
    this.text = text;
    this.completed = completed;
  }

  toggle() {
    this.completed = !this.completed;
  }

  setText(newText) {
    this.text = newText;
  }
}

// Module‑scoped state
let todos = [];
let currentFilter = FILTERS.ALL;

// Cached DOM references (may be null until DOM ready)
const newTodoInput = document.getElementById('new-todo');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('[data-filter]');
const itemsLeftSpan = document.getElementById('items-left');

// Persistence helpers -------------------------------------------------------
function loadTodos() {
  const raw = localStorage.getItem('colorfulTodo');
  if (!raw) {
    todos = [];
    return;
  }
  try {
    const data = JSON.parse(raw);
    // Re‑hydrate plain objects into Todo instances
    todos = data.map(item => new Todo(item.id, item.text, item.completed));
  } catch (e) {
    console.error('Failed to parse stored todos', e);
    todos = [];
  }
}

function saveTodos() {
  const payload = JSON.stringify(todos.map(t => ({ id: t.id, text: t.text, completed: t.completed })));
  localStorage.setItem('colorfulTodo', payload);
}

// Rendering ---------------------------------------------------------------
function renderTodos() {
  if (!todoList) return;
  // Clear existing list
  todoList.innerHTML = '';

  const filtered = todos.filter(todo => {
    if (currentFilter === FILTERS.ACTIVE) return !todo.completed;
    if (currentFilter === FILTERS.COMPLETED) return todo.completed;
    return true; // FILTERS.ALL
  });

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.className = todo.completed ? 'completed' : '';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.className = 'toggle-complete';
    li.appendChild(checkbox);

    // Text span (editable)
    const span = document.createElement('span');
    span.textContent = todo.text;
    span.contentEditable = 'true';
    span.className = 'todo-text';
    li.appendChild(span);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'delete-todo';
    li.appendChild(delBtn);

    todoList.appendChild(li);
  });

  // Update items‑left count
  if (itemsLeftSpan) {
    const leftCount = todos.filter(t => !t.completed).length;
    itemsLeftSpan.textContent = `${leftCount} item${leftCount !== 1 ? 's' : ''} left`;
  }

  // Highlight active filter button
  filterButtons.forEach(btn => {
    if (btn.dataset.filter === currentFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// CRUD operations ----------------------------------------------------------
function addTodo(text) {
  if (!text) return;
  const id = Date.now();
  const todo = new Todo(id, text);
  todos.push(todo);
  saveTodos();
  renderTodos();
}

function editTodo(id, newText) {
  const todo = todos.find(t => t.id === Number(id) || t.id === id);
  if (!todo) return;
  todo.setText(newText);
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => !(t.id === Number(id) || t.id === id));
  saveTodos();
  renderTodos();
}

function toggleComplete(id) {
  const todo = todos.find(t => t.id === Number(id) || t.id === id);
  if (!todo) return;
  todo.toggle();
  saveTodos();
  renderTodos();
}

// Filter handling ----------------------------------------------------------
function setFilter(filter) {
  if (!Object.values(FILTERS).includes(filter)) return;
  currentFilter = filter;
  renderTodos();
}

// Helper to clear completed todos (used by shortcut)
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
}

// Initialise ----------------------------------------------------------------
function init() {
  loadTodos();
  renderTodos();

  // New‑todo entry – Enter key (without Shift)
  if (newTodoInput) {
    newTodoInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const value = newTodoInput.value.trim();
        if (value) {
          addTodo(value);
          newTodoInput.value = '';
        }
      }
    });
  }

  // Delegated events on the todo list
  if (todoList) {
    // Delete button click
    todoList.addEventListener('click', e => {
      const target = e.target;
      if (target.classList.contains('delete-todo')) {
        const li = target.closest('li');
        if (li && li.dataset.id) {
          deleteTodo(li.dataset.id);
        }
      }
    });

    // Checkbox change (toggle complete)
    todoList.addEventListener('change', e => {
      const target = e.target;
      if (target.classList.contains('toggle-complete')) {
        const li = target.closest('li');
        if (li && li.dataset.id) {
          toggleComplete(li.dataset.id);
        }
      }
    });

    // Inline edit – on focusout or Enter key
    todoList.addEventListener('focusout', e => {
      const target = e.target;
      if (target.classList.contains('todo-text')) {
        const li = target.closest('li');
        if (li && li.dataset.id) {
          const newText = target.textContent.trim();
          editTodo(li.dataset.id, newText);
        }
      }
    });

    todoList.addEventListener('keydown', e => {
      const target = e.target;
      if (target.classList.contains('todo-text') && e.key === 'Enter') {
        e.preventDefault(); // keep from creating a newline
        target.blur(); // trigger focusout handling
      }
    });
  }

  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      setFilter(filter);
    });
  });

  // Global shortcuts
  document.addEventListener('keydown', e => {
    // Ctrl + Backspace → clear completed
    if (e.ctrlKey && e.key === 'Backspace') {
      e.preventDefault();
      clearCompleted();
    }
    // Alt + A (or a) → focus the new‑todo input
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      if (newTodoInput) newTodoInput.focus();
    }
  });
}

// Expose helpers for debugging
window.ColorfulTodo = {
  addTodo,
  editTodo,
  deleteTodo,
  toggleComplete,
  setFilter,
  loadTodos,
  saveTodos,
  clearCompleted,
};

// Execute init when the module is loaded
init();
