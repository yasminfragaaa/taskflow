'use strict';

const STORAGE_KEY = 'taskflow.tasks.v1';
const STARTER_TASKS = [
  {id:'starter-1',title:'Complete portfolio website',description:'Update layout and improve responsiveness',category:'Work',dueDate:'2026-10-15',priority:'high',status:'pending'},
  {id:'starter-2',title:'Study SQL',description:'Finish the practice exercises',category:'Study',dueDate:'2026-10-20',priority:'medium',status:'pending'},
  {id:'starter-3',title:'Create inventory system (Python)',description:'Add new features and test',category:'Work',dueDate:'2026-10-25',priority:'medium',status:'pending'},
  {id:'starter-4',title:'Organize weekly schedule',description:'Plan tasks and appointments',category:'Personal',dueDate:'2026-11-05',priority:'low',status:'pending'},
  {id:'starter-5',title:'Plan weekly workouts',description:'Create a balanced exercise routine',category:'Health',dueDate:'2026-11-08',priority:'high',status:'pending'}
];
const CATEGORIES = ['Work','Study','Personal','Health'];
const STATUSES = ['pending','in-progress','completed'];
const PRIORITIES = ['high','medium','low'];
const ICONS = {
  house:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-8h6v8"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  settings:'<path d="M10 2h4l.6 2.3 2 .9 2.1-1.2 2.8 2.8-1.2 2.1.9 2L23 11v4l-2.7.6-.9 2 1.2 2.1-2.8 2.8-2.1-1.2-2 .9L14 24h-4l-.6-2.7-2-.9-2.1 1.2-2.8-2.8 1.2-2.1-.9-2L1 14v-4l2.7-.6.9-2-1.2-2.1L6.2 2.5l2.1 1.2 2-.9L10 2Z" transform="translate(1 1) scale(.88)"/><circle cx="12" cy="12" r="3"/>'
};

document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.icon] || ''}</svg>`;
});

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(STARTER_TASKS);
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Invalid stored tasks');
    return parsed.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string');
  } catch (error) {
    console.warn('Could not load saved tasks:', error);
    return structuredClone(STARTER_TASKS);
  }
}
let tasks = loadTasks();
let view = 'all';
let statusFilter = 'all';
let categoryFilter = null;
let editingId = null;
const taskList = document.querySelector('#taskList');
const dialog = document.querySelector('#taskDialog');
const detailsForm = document.querySelector('#detailsForm');
const newTaskInput = document.querySelector('#newTask');
const toast = document.querySelector('#toast');
let toastTimeout;
function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); }
  catch (error) { console.warn('Could not save tasks:',error); notify('Could not save tasks in this browser.'); }
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>toast.classList.remove('visible'),2600);
}
function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function formatDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return 'No date';
  const [year,month,day]=iso.split('-').map(Number);
  const date = new Date(year,month-1,day);
  return date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function visibleTasks() {
  const today = localToday();
  const filtered = tasks.filter(t => {
    if(categoryFilter && t.category !== categoryFilter) return false;
    if(view === 'today' && t.dueDate !== today) return false;
    if(view === 'upcoming' && (t.dueDate < today || t.status === 'completed')) return false;
    if(view === 'completed' && t.status !== 'completed') return false;
    if(statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });
  const sort = document.querySelector('#sortSelect').value;
  return filtered.sort((a,b)=>{
    if(sort==='name') return a.title.localeCompare(b.title);
    if(sort==='priority') return PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority) || a.dueDate.localeCompare(b.dueDate);
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });
}
function element(tag,className,text) {
  const el=document.createElement(tag);
  if(className) el.className=className;
  if(text!==undefined) el.textContent=text;
  return el;
}
function renderCard(task) {
  const card=element('article',`task-card${task.status==='completed'?' is-completed':''}`);
  card.dataset.id=task.id;
  const check=element('input','task-check');
  check.type='checkbox'; check.checked=task.status==='completed';check.setAttribute('aria-label',`Mark ${task.title} completed`);
  check.addEventListener('change',()=>updateTask(task.id,{status:check.checked?'completed':'pending'}));
  const copy=element('div','task-copy');
  copy.append(element('div','task-title',task.title),element('div','task-description',task.description || (task.status==='in-progress'?'In progress':'No description')));
  const category=element('span',`tag tag-${CATEGORIES.includes(task.category)?task.category.toLowerCase():'work'}`,task.category);
  const due=element('time','task-date',formatDate(task.dueDate));
  due.dateTime=task.dueDate;
  const priority=element('span',`priority priority-${task.status==='completed'?'completed':task.priority}`,task.status==='completed'?'Completed':task.priority[0].toUpperCase()+task.priority.slice(1));
  const actions=element('div','task-actions');
  const more=element('button','more-button','···');more.type='button';more.title='Task options';more.setAttribute('aria-label',`Options for ${task.title}`);more.setAttribute('aria-expanded','false');
  more.addEventListener('click',event=>{
    event.stopPropagation();
    document.querySelectorAll('.card-menu').forEach(m=>m.remove());
    document.querySelectorAll('.more-button').forEach(b=>b.setAttribute('aria-expanded','false'));
    const menu=element('div','card-menu');
    const edit=element('button','','Edit task');edit.type='button';edit.addEventListener('click',()=>openDetails(task));
    const progress=element('button','',task.status==='in-progress'?'Mark pending':'Mark in progress');progress.type='button';progress.addEventListener('click',()=>updateTask(task.id,{status:task.status==='in-progress'?'pending':'in-progress'}));
    const remove=element('button','danger','Delete task');remove.type='button';remove.addEventListener('click',()=>{
      if(window.confirm(`Delete "${task.title}"?`)){tasks=tasks.filter(t=>t.id!==task.id);saveTasks();render();notify('Task deleted');}
    });
    menu.append(edit,progress,remove);actions.append(menu);more.setAttribute('aria-expanded','true');
  });
  actions.append(more);card.append(check,copy,category,due,priority,actions);
  return card;
}
function render() {
  const visible=visibleTasks();
  const titles={all:'My Tasks',today:'Today',upcoming:'Upcoming',completed:'Completed'};
  document.querySelector('#viewTitle').textContent=categoryFilter?`${categoryFilter} Tasks`:titles[view];
  document.querySelector('#taskSummary').textContent=`${visible.length} ${visible.length===1?'task':'tasks'}`;
  taskList.replaceChildren(...visible.map(renderCard));
  document.querySelector('#emptyState').hidden=visible.length!==0;
  document.querySelectorAll('[data-count]').forEach(el=>{el.textContent=tasks.filter(t=>t.category===el.dataset.count).length;});
  document.querySelectorAll('[data-view]').forEach(b=>{const active=view===b.dataset.view && !categoryFilter;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',categoryFilter===b.dataset.category));
  document.querySelectorAll('[data-status]').forEach(b=>{const active=statusFilter===b.dataset.status;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function updateTask(id,changes) {
  tasks=tasks.map(t=>t.id===id?{...t,...changes}:t);
  saveTasks();render();
}
function openDetails(task=null) {
  editingId=task?.id || null;
  document.querySelector('#dialogHeading').textContent=task?'Edit task':'New task';
  document.querySelector('#detailTitle').value=task?.title || newTaskInput.value.trim();
  document.querySelector('#detailDescription').value=task?.description || '';
  document.querySelector('#detailCategory').value=task?.category || 'Work';
  document.querySelector('#detailPriority').value=task?.priority || 'medium';
  document.querySelector('#detailDue').value=task?.dueDate || localToday();
  document.querySelector('#detailStatus').value=task?.status || 'pending';
  dialog.showModal();
}
document.querySelector('#taskForm').addEventListener('submit',event=>{
  event.preventDefault();
  if(!newTaskInput.value.trim()){newTaskInput.focus();return;}
  openDetails();
});
detailsForm.addEventListener('submit',event=>{
  event.preventDefault();
  const title=document.querySelector('#detailTitle').value.trim();
  if(!title){document.querySelector('#detailTitle').focus();return;}
  const category=document.querySelector('#detailCategory').value;
  const priority=document.querySelector('#detailPriority').value;
  const status=document.querySelector('#detailStatus').value;
  const data={title,description:document.querySelector('#detailDescription').value.trim(),category:CATEGORIES.includes(category)?category:'Work',priority:PRIORITIES.includes(priority)?priority:'medium',status:STATUSES.includes(status)?status:'pending',dueDate:document.querySelector('#detailDue').value};
  if(editingId){updateTask(editingId,data);notify('Task updated');}
  else {tasks.push({id:crypto.randomUUID(),...data});saveTasks();render();notify('Task added');}
  dialog.close();newTaskInput.value='';
});
document.querySelector('#cancelDetails').addEventListener('click',()=>dialog.close());
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;categoryFilter=null;statusFilter='all';render();}));
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{categoryFilter=categoryFilter===b.dataset.category?null:b.dataset.category;view='all';statusFilter='all';render();}));
document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{statusFilter=b.dataset.status;render();}));
document.querySelector('#sortSelect').addEventListener('change',render);
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();view='all';categoryFilter=null;statusFilter='all';render();});
document.querySelector('#settingsButton').addEventListener('click',()=>notify('Settings will be available in a future update.'));
document.addEventListener('click',event=>{if(!event.target.closest('.task-actions')){document.querySelectorAll('.card-menu').forEach(m=>m.remove());document.querySelectorAll('.more-button').forEach(b=>b.setAttribute('aria-expanded','false'));}});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.card-menu').forEach(m=>m.remove());});
render();
