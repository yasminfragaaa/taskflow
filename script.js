
"use strict";

/* ==================================
   1. ELEMENTOS DO HTML
================================== */

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskTotal = document.querySelector("#task-total");

const taskDialog = document.querySelector("#task-dialog");
const detailsForm = document.querySelector("#details-form");
const cancelDialog = document.querySelector("#cancel-dialog");

const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const detailCategory = document.querySelector("#detail-category");
const detailPriority = document.querySelector("#detail-priority");
const detailDate = document.querySelector("#detail-date");
const detailStatus = document.querySelector("#detail-status");

const sortTasks = document.querySelector("#sort-tasks");

const filterButtons = document.querySelectorAll(".filter");
const navButtons = document.querySelectorAll(".nav-link");
const categoryButtons = document.querySelectorAll(".category");

/* ==================================
   2. DADOS DA APLICAÇÃO
================================== */

const STORAGE_KEY = "taskflow-tasks";

function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Error loading tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

let currentFilter = "all";
let currentView = "all";
let currentCategory = null;
let editingTaskId = null;

/* ==================================
   3. SALVAR TAREFAS
================================== */

function saveTasks() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}

/* ==================================
   4. FUNÇÕES DE DATA
================================== */

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) {
        return "No due date";
    }

    const parts = dateString.split("-");

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* ==================================
   5. ABRIR FORMULÁRIO DE TAREFA
================================== */

function openTaskDialog(task = null) {
    detailsForm.reset();

    if (task) {
        editingTaskId = task.id;

        detailTitle.value = task.title;
        detailDescription.value = task.description || "";
        detailCategory.value = task.category;
        detailPriority.value = task.priority;
        detailDate.value = task.dueDate;
        detailStatus.value = task.status;
    } else {
        editingTaskId = null;

        detailTitle.value = taskInput.value.trim();
        detailCategory.value = "Work";
        detailPriority.value = "medium";
        detailDate.value = getToday();
        detailStatus.value = "pending";
    }

    taskDialog.showModal();
    detailTitle.focus();
}

/* ==================================
   6. BOTÃO PARA ADICIONAR TAREFA
================================== */

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        return;
    }

    openTaskDialog();
});

/* ==================================
   7. CRIAR OU EDITAR TAREFA
================================== */

detailsForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = detailTitle.value.trim();

    if (!title || !detailDate.value) {
        return;
    }

    const taskData = {
        title: title,
        description: detailDescription.value.trim(),
        category: detailCategory.value,
        priority: detailPriority.value,
        dueDate: detailDate.value,
        status: detailStatus.value
    };

    if (editingTaskId !== null) {
        tasks = tasks.map(function(task) {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    ...taskData
                };
            }

            return task;
        });
    } else {
        const newTask = {
            id: crypto.randomUUID(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
    }

    saveTasks();
    renderTasks();

    taskDialog.close();
    taskInput.value = "";
    editingTaskId = null;
});

/* ==================================
   8. CANCELAR FORMULÁRIO
================================== */

cancelDialog.addEventListener("click", function() {
    taskDialog.close();
});

taskDialog.addEventListener("close", function() {
    editingTaskId = null;
});

/* ==================================
   9. EXCLUIR TAREFA
================================== */

function deleteTask(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(function(task) {
        return task.id !== id;
    });

    saveTasks();
    renderTasks();
}

/* ==================================
   10. CONCLUIR TAREFA
================================== */

function toggleTask(id) {
    tasks = tasks.map(function(task) {
        if (task.id === id) {
            return {
                ...task,
                status: task.status === "completed"
                    ? "pending"
                    : "completed"
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

/* ==================================
   11. FILTRAR AS TAREFAS
================================== */

function getFilteredTasks() {
    let result = [...tasks];

    const today = getToday();

    if (currentView === "today") {
        result = result.filter(function(task) {
            return task.dueDate === today;
        });
    }

    if (currentView === "upcoming") {
        result = result.filter(function(task) {
            return task.dueDate > today;
        });
    }

    if (currentView === "completed") {
        result = result.filter(function(task) {
            return task.status === "completed";
        });
    }

    if (currentCategory !== null) {
        result = result.filter(function(task) {
            return task.category === currentCategory;
        });
    }

    if (currentFilter !== "all") {
        result = result.filter(function(task) {
            return task.status === currentFilter;
        });
    }

    return result;
}

/* ==================================
   12. ORDENAR TAREFAS
================================== */

function getSortedTasks(taskArray) {
    const result = [...taskArray];

    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };

    if (sortTasks.value === "date") {
        result.sort(function(a, b) {
            return (a.dueDate || "9999").localeCompare(
                b.dueDate || "9999"
            );
        });
    }

    if (sortTasks.value === "priority") {
        result.sort(function(a, b) {
            return (
                (priorityOrder[a.priority] || 4) -
                (priorityOrder[b.priority] || 4)
            );
        });
    }

    if (sortTasks.value === "name") {
        result.sort(function(a, b) {
            return a.title.localeCompare(b.title);
        });
    }

    return result;
}

/* ==================================
   13. CRIAR CARTÃO VISUAL
================================== */

function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";

    const top = document.createElement("div");
    top.className = "task-card-top";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "completed";

    checkbox.addEventListener("change", function() {
        toggleTask(task.id);
    });

    const title = document.createElement("h3");
    title.textContent = task.title;

    if (task.status === "completed") {
        title.style.textDecoration = "line-through";
        title.style.opacity = "0.6";
    }

    top.append(checkbox, title);

    const description = document.createElement("p");
    description.textContent = task.description || "";

    const information = document.createElement("div");
    information.className = "task-information";

    const category = document.createElement("span");
    category.className = "task-category";
    category.textContent = task.category;

    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority}`;
    priority.textContent = task.priority;

    const status = document.createElement("span");
    status.className = `status status-${task.status}`;
    status.textContent = task.status.replace("-", " ");

    const date = document.createElement("span");
    date.className = "task-date";
    date.textContent = formatDate(task.dueDate);

    information.append(category, priority, status, date);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.className = "edit-task";

    editButton.addEventListener("click", function() {
        openTaskDialog(task);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-task";

    deleteButton.addEventListener("click", function() {
        deleteTask(task.id);
    });

    actions.append(editButton, deleteButton);

    card.append(top);

    if (task.description) {
        card.append(description);
    }

    card.append(information, actions);

    return card;
}

/* ==================================
   14. ATUALIZAR CONTADORES
================================== */

function updateCounters() {
    const categories = ["Work", "Study", "Personal", "Health"];

    categories.forEach(function(category) {
        const count = tasks.filter(function(task) {
            return task.category === category;
        }).length;

        const element = document.querySelector(
            `#count-${category.toLowerCase()}`
        );

        if (element) {
            element.textContent = count;
        }
    });
}

/* ==================================
   15. MOSTRAR AS TAREFAS NA TELA
================================== */

function renderTasks() {
    taskList.innerHTML = "";

    const filtered = getFilteredTasks();
    const sorted = getSortedTasks(filtered);

    taskTotal.textContent = `${sorted.length} tasks`;

    if (sorted.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No tasks found. Add your first task!";

        taskList.appendChild(message);
    } else {
        sorted.forEach(function(task) {
            taskList.appendChild(createTaskCard(task));
        });
    }

    updateCounters();
}

/* ==================================
   16. BOTÕES DOS FILTROS
================================== */

filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();
    });
});

/* ==================================
   17. NAVEGAÇÃO LATERAL
================================== */

navButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        currentView = button.dataset.view;
        currentCategory = null;

        navButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        categoryButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();
    });
});

/* ==================================
   18. FILTROS POR CATEGORIA
================================== */

categoryButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        const category = button.dataset.category;

        if (currentCategory === category) {
            currentCategory = null;
        } else {
            currentCategory = category;
        }

        currentView = "all";

        navButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        categoryButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        if (currentCategory !== null) {
            button.classList.add("active");
        } else {
            const allButton = document.querySelector(
                '.nav-link[data-view="all"]'
            );

            if (allButton) {
                allButton.classList.add("active");
            }
        }

        renderTasks();
    });
});

/* ==================================
   19. ALTERAR A ORDENAÇÃO
================================== */

sortTasks.addEventListener("change", function() {
    renderTasks();
});

/* ==================================
   20. INICIAR A APLICAÇÃO
================================== */

renderTasks();
