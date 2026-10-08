// TaskFlow — Interactive Logic & Persistence
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const todoForm = document.getElementById('todo-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const taskCount = document.getElementById('task-count');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const currentDateEl = document.getElementById('current-date');

  // Format today's date in header badge
  const today = new Date();
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  currentDateEl.textContent = today.toLocaleDateString(undefined, dateOptions);

  // Initial State from LocalStorage or seed defaults
  const STORAGE_KEY = 'taskflow_tasks_v1';
  let currentFilter = 'all';

  let tasks = loadTasks();

  function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
      }
    }
    // Default starter tasks for first-time users
    return [
      { id: '1', text: 'Welcome to your new TaskFlow to-do app! 👋', completed: false },
      { id: '2', text: 'Click the Add button or press Enter to add new tasks', completed: false },
      { id: '3', text: 'Tap any task to mark it as completed', completed: true }
    ];
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // Render Tasks according to current filter
  function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true; // 'all'
    });

    if (filteredTasks.length === 0) {
      emptyState.classList.add('visible');
      if (currentFilter === 'completed' && tasks.length > 0) {
        emptyState.querySelector('.empty-title').textContent = 'No completed tasks yet';
        emptyState.querySelector('.empty-subtitle').textContent = 'Complete tasks to see them archived here.';
      } else if (currentFilter === 'active' && tasks.length > 0) {
        emptyState.querySelector('.empty-title').textContent = 'All caught up!';
        emptyState.querySelector('.empty-subtitle').textContent = 'You have no pending tasks right now.';
      } else {
        emptyState.querySelector('.empty-title').textContent = 'All clear!';
        emptyState.querySelector('.empty-subtitle').textContent = 'Add a task above to kickstart your day.';
      }
    } else {
      emptyState.classList.remove('visible');

      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
          <div class="task-main" role="checkbox" aria-checked="${task.completed}" tabindex="0">
            <div class="custom-checkbox">
              <svg viewBox="0 0 24 24" fill="none">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
          </div>
          <div class="task-actions">
            <button class="delete-btn" aria-label="Delete task" title="Delete task">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        // Toggle task completion on click
        const taskMain = li.querySelector('.task-main');
        taskMain.addEventListener('click', () => toggleTask(task.id));
        taskMain.addEventListener('keydown', (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleTask(task.id);
          }
        });

        // Delete task button handler
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task.id, li);
        });

        taskList.appendChild(li);
      });
    }

    updateStats();
  }

  // Helper to escape HTML characters safely
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Update Footer stats & Progress Bar
  function updateStats() {
    const total = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const activeCount = total - completedCount;

    // Remaining count
    taskCount.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} left`;

    // Progress percentage
    const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    progressText.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
  }

  // Add Task
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      taskInput.classList.add('shake');
      taskInput.focus();
      setTimeout(() => taskInput.classList.remove('shake'), 400);
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false
    };

    tasks.unshift(newTask);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    renderTasks();
  }

  // Toggle Task Completion
  function toggleTask(id) {
    tasks = tasks.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    saveTasks();
    renderTasks();
  }

  // Delete Task with Smooth Exit Animation
  function deleteTask(id, element) {
    element.classList.add('removing');
    element.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, { once: true });
  }

  // Form Submit Handler (handles both clicking 'Add' and pressing Enter)
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Clear Completed Tasks
  clearCompletedBtn.addEventListener('click', () => {
    const hasCompleted = tasks.some(t => t.completed);
    if (!hasCompleted) return;

    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  });

  // Initial Render
  renderTasks();
});
