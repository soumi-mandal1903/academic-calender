// ============================================================
// ACADEMIC CALENDAR PWA
// IMPORTANT: paste your Apps Script /exec URL below.
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxSqCl2soPeedUu8ZbNa19RCRYswUzp95CeRwWg4WgORT5Po6U7TRhub81vlBg5qfkz/exec';

let events = [];
let currentDate = new Date();
let editingId = null;

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  registerPWA();
  bindUI();
  loadEvents();
});

function bindUI() {
  $('addBtn').onclick = () => openAdd();
  $('closeBtn').onclick = closeModal;
  $('cancelBtn').onclick = closeModal;
  $('deleteBtn').onclick = deleteCurrent;
  $('eventForm').onsubmit = saveEvent;
  $('prevBtn').onclick = () => { currentDate.setMonth(currentDate.getMonth()-1); render(); };
  $('nextBtn').onclick = () => { currentDate.setMonth(currentDate.getMonth()+1); render(); };
  $('todayBtn').onclick = () => { currentDate = new Date(); render(); };
  $('filter').onchange = render;
  $('modal').onclick = e => { if(e.target === $('modal')) closeModal(); };
}

function registerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

function loadEvents() {
  if (!API_URL || API_URL.includes('PASTE_')) {
    toast('First paste your Apps Script /exec URL into app.js.');
    events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    render();
    return;
  }

  showLoading();

  jsonp(API_URL + '?action=events')
    .then(data => {
      if (!data.success) throw new Error(data.message || 'Could not load events.');
      events = data.events || [];
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      render();
    })
    .catch(err => {
      events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
      render();
      toast('Offline mode: showing saved calendar.');
      console.error(err);
    })
    .finally(hideLoading);
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = '__calendar_cb_' + Date.now() + '_' + Math.floor(Math.random()*10000);
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out.'));
    }, 15000);

    window[cb] = data => {
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error('Could not reach Apps Script.'));
    };

    script.src = url + (url.includes('?') ? '&' : '?') + 'prefix=' + encodeURIComponent(cb);
    document.head.appendChild(script);

    function cleanup() {
      delete window[cb];
      script.remove();
    }
  });
}

async function apiWrite(action, payload) {
  const params = new URLSearchParams();
  params.set('action', action);
  if (action === 'delete') params.set('id', payload);
  else params.set('data', JSON.stringify(payload));

  // Simple form-urlencoded POST avoids a browser preflight.
  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: params
  });
}

function render() {
  renderCalendar();
  renderUpcoming();
}

function renderCalendar() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  $('monthTitle').textContent = currentDate.toLocaleString('en-IN', {month:'long', year:'numeric'});

  const first = new Date(y,m,1).getDay();
  const totalDays = new Date(y,m+1,0).getDate();
  const prevDays = new Date(y,m,0).getDate();
  const cells = Math.ceil((first+totalDays)/7)*7;
  const filter = $('filter').value;

  $('calendarGrid').innerHTML = '';

  for(let i=0;i<cells;i++){
    let d, other=false, n;
    if(i<first){ n=prevDays-first+i+1; d=new Date(y,m-1,n); other=true; }
    else if(i>=first+totalDays){ n=i-first-totalDays+1; d=new Date(y,m+1,n); other=true; }
    else { n=i-first+1; d=new Date(y,m,n); }

    const cell=document.createElement('div');
    cell.className='day' + (other?' other':'') + (sameDay(d,new Date())?' today':'');
    cell.innerHTML=`<div class="daynum">${n}</div>`;

    if(!other){
      cell.onclick=()=>openAdd(dateInput(d));
    }

    let dayEvents=events.filter(e=>e.startDate===dateInput(d));
    if(filter!=='All') dayEvents=dayEvents.filter(e=>e.category===filter);

    dayEvents.sort(compareEvents).forEach(e=>{
      const el=document.createElement('div');
      el.className='event '+e.category;
      el.textContent=(e.startTime?displayTime(e.startTime)+' ':'')+e.title;
      el.title=e.title;
      el.onclick=ev=>{ev.stopPropagation();openEdit(e.id);};
      cell.appendChild(el);
    });

    $('calendarGrid').appendChild(cell);
  }
}

function renderUpcoming() {
  const today=new Date(); today.setHours(0,0,0,0);
  const list=events.filter(e=>parseDate(e.startDate)>=today).sort(compareEvents).slice(0,10);
  $('upcoming').innerHTML = '';

  if(!list.length){
    $('upcoming').innerHTML='<div class="up-meta">No upcoming events.</div>';
    return;
  }

  list.forEach(e=>{
    const item=document.createElement('div');
    item.className='up-item';
    item.onclick=()=>openEdit(e.id);

    const main=document.createElement('div');
    main.innerHTML=`<div class="up-title">${escapeHtml(e.title)}</div>
      <div class="up-meta">${displayDate(e.startDate)}${e.startTime?' · '+displayTime(e.startTime):''}${e.location?' · '+escapeHtml(e.location):''}</div>`;

    const tag=document.createElement('span');
    tag.className='tag '+e.category;
    tag.textContent=categoryName(e.category);

    item.append(main,tag);
    $('upcoming').appendChild(item);
  });
}

function openAdd(date) {
  editingId=null;
  $('modalTitle').textContent='Add Event';
  $('eventForm').reset();
  $('eventId').value='';
  $('deleteBtn').style.display='none';

  const d=date||dateInput(new Date());
  $('startDate').value=d;
  $('endDate').value=d;
  $('modal').classList.remove('hidden');
}

function openEdit(id) {
  const e=events.find(x=>String(x.id)===String(id));
  if(!e)return;

  editingId=e.id;
  $('modalTitle').textContent='Edit Event';
  $('eventId').value=e.id;
  $('title').value=e.title;
  $('category').value=e.category;
  $('startDate').value=e.startDate;
  $('endDate').value=e.endDate||e.startDate;
  $('startTime').value=e.startTime||'';
  $('endTime').value=e.endTime||'';
  $('location').value=e.location||'';
  $('description').value=e.description||'';
  $('recurring').value=e.recurring||'None';
  $('deleteBtn').style.display='block';
  $('modal').classList.remove('hidden');
}

function closeModal(){ $('modal').classList.add('hidden'); }

async function saveEvent(ev) {
  ev.preventDefault();

  const event={
    id:$('eventId').value,
    title:$('title').value.trim(),
    category:$('category').value,
    startDate:$('startDate').value,
    endDate:$('endDate').value || $('startDate').value,
    startTime:$('startTime').value,
    endTime:$('endTime').value,
    location:$('location').value.trim(),
    description:$('description').value.trim(),
    recurring:$('recurring').value
  };

  if(!event.title || !event.startDate){
    toast('Enter an event title and date.');
    return;
  }

  showLoading();

  try {
    await apiWrite(editingId?'update':'add',event);
    closeModal();
    await delay(900);
    loadEvents();
    toast(editingId?'Event updated.':'Event added.');
  } catch(err) {
    toast('Could not save event.');
    console.error(err);
  } finally {
    hideLoading();
  }
}

async function deleteCurrent() {
  if(!editingId || !confirm('Delete this event?'))return;

  showLoading();
  try {
    await apiWrite('delete',editingId);
    closeModal();
    await delay(900);
    loadEvents();
    toast('Event deleted.');
  } catch(err) {
    toast('Could not delete event.');
    console.error(err);
  } finally {
    hideLoading();
  }
}

function parseDate(s){
  const p=s.split('-');
  return new Date(+p[0],+p[1]-1,+p[2]);
}

function dateInput(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function displayDate(s){
  return parseDate(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}

function displayTime(s){
  if(!s)return '';
  const p=s.split(':'); let h=+p[0];
  const ap=h>=12?'PM':'AM'; h=h%12||12;
  return `${h}:${p[1]} ${ap}`;
}

function compareEvents(a,b){
  return (a.startDate+' '+(a.startTime||'00:00')).localeCompare(b.startDate+' '+(b.startTime||'00:00'));
}

function categoryName(c){
  return ({
    Supervisor:'Supervisor',Viva:'Viva',Class:'Class',ExtraClass:'Extra Class',
    Exam:'Exam',Submission:'Submission',Office:'Office Work',
    Professor:'Professor Meeting',Conference:'Conference',Abstract:'Abstract',
    Presentation:'Presentation',LabHours:'Lab Hours',LabClass:'Lab Class',Other:'Other'
  })[c]||c;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function showLoading(){ $('loading').classList.remove('hidden'); }
function hideLoading(){ $('loading').classList.add('hidden'); }
function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

let toastTimer;
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.style.display='block';
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.style.display='none',2800);
}