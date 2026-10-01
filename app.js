// ============================================================
// ACADEMIC CALENDAR PWA
// JSONP version: avoids browser CORS restrictions with Apps Script.
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxSqCl2soPeedUu8ZbNa19RCRYswUzp95CeRwWg4WgORT5Po6U7TRhub81vlBg5qfkz/exec';

let events = [];
let currentDate = new Date();
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Academic Calendar JS loaded.');
  registerServiceWorker();
  setupButtons();
  loadEvents();
});

function setupButtons() {
  $('addBtn').onclick = () => openAdd();
  $('prevBtn').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render();
  };
  $('nextBtn').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render();
  };
  $('todayBtn').onclick = () => {
    currentDate = new Date();
    render();
  };

  $('filter').onchange = render;
  $('closeBtn').onclick = closeModal;
  $('cancelBtn').onclick = closeModal;
  $('deleteBtn').onclick = deleteCurrent;
  $('eventForm').onsubmit = saveEvent;

  $('modal').onclick = e => {
    if (e.target === $('modal')) closeModal();
  };
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

function loadEvents() {
  if (!API_URL || API_URL.includes('PASTE_')) {
    events = JSON.parse(
      localStorage.getItem('calendarEvents') || '[]'
    );

    render();
    hideLoading();

    showToast(
      'Add your Apps Script /exec URL in app.js.'
    );

    return;
  }

  showLoading();

  jsonpRequest(API_URL + '?action=events')
    .then(data => {
      if (!data.success) {
        throw new Error(
          data.message || 'Could not load events.'
        );
      }

      events = data.events || [];

      localStorage.setItem(
        'calendarEvents',
        JSON.stringify(events)
      );

      render();
    })
    .catch(err => {
      console.error('API ERROR:', err);

      events = JSON.parse(
        localStorage.getItem('calendarEvents') || '[]'
      );

      render();

      showToast(
        'Could not connect to Google Sheets. Showing saved data.'
      );
    })
    .finally(hideLoading);
}


// ============================================================
// JSONP REQUEST
// ============================================================

function jsonpRequest(url) {
  return new Promise((resolve, reject) => {

    const callbackName =
      '__calendar_jsonp_' +
      Date.now() +
      '_' +
      Math.floor(Math.random() * 100000);

    const script = document.createElement('script');

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error('Apps Script request timed out.')
      );
    }, 20000);

    window[callbackName] = data => {
      clearTimeout(timeout);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();

      reject(
        new Error('Could not connect to Apps Script.')
      );
    };

    const separator =
      url.includes('?') ? '&' : '?';

    script.src =
      url +
      separator +
      'prefix=' +
      encodeURIComponent(callbackName);

    document.head.appendChild(script);

    function cleanup() {
      delete window[callbackName];
      script.remove();
    }
  });
}


// ============================================================
// API ACTIONS
// ============================================================

function apiAction(action, payload) {

  let url =
    API_URL +
    '?action=' +
    encodeURIComponent(action);

  if (action === 'delete') {

    url +=
      '&id=' +
      encodeURIComponent(payload);

  } else {

    url +=
      '&data=' +
      encodeURIComponent(
        JSON.stringify(payload)
      );
  }

  return jsonpRequest(url);
}


// ============================================================
// MAIN RENDER
// ============================================================

function render() {
  renderCalendar();
  renderUpcoming();
}


// ============================================================
// RECURRENCE LOGIC
// ============================================================

function eventOccursOnDate(event, date) {

  const start =
    parseDate(event.startDate);

  const end =
    parseDate(
      event.endDate ||
      event.startDate
    );

  const d =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  // Outside event range
  if (d < start || d > end) {
    return false;
  }

  const recurrence =
    String(
      event.recurring || 'None'
    )
      .trim()
      .toLowerCase();


  // ----------------------------------------------------------
  // DAILY
  // ----------------------------------------------------------

  if (recurrence === 'daily') {
    return true;
  }


  // ----------------------------------------------------------
  // WEEKLY
  // ----------------------------------------------------------

  if (recurrence === 'weekly') {

    const diffDays =
      Math.round(
        (d - start) / 86400000
      );

    return (
      diffDays >= 0 &&
      diffDays % 7 === 0
    );
  }


  // ----------------------------------------------------------
  // MONTHLY
  // ----------------------------------------------------------

  if (recurrence === 'monthly') {

    return (
      d.getDate() ===
      start.getDate()
    );
  }


  // ----------------------------------------------------------
  // NORMAL EVENT
  // ----------------------------------------------------------

  // A normal event with different start/end
  // occupies every date in that range.

  return true;
}


// ============================================================
// CALENDAR RENDERING
// ============================================================

function renderCalendar() {

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  $('monthTitle').textContent =
    currentDate.toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric'
      }
    );


  const grid =
    $('calendarGrid');

  grid.innerHTML = '';


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();


  const totalCells =
    Math.ceil(
      (firstDay + daysInMonth) / 7
    ) * 7;


  const filter =
    $('filter').value;


  for (
    let i = 0;
    i < totalCells;
    i++
  ) {

    let date;
    let dayNumber;
    let otherMonth = false;


    // --------------------------------------------------------
    // PREVIOUS MONTH
    // --------------------------------------------------------

    if (i < firstDay) {

      dayNumber =
        previousMonthDays -
        firstDay +
        i +
        1;

      date =
        new Date(
          year,
          month - 1,
          dayNumber
        );

      otherMonth = true;

    }


    // --------------------------------------------------------
    // NEXT MONTH
    // --------------------------------------------------------

    else if (
      i >=
      firstDay + daysInMonth
    ) {

      dayNumber =
        i -
        firstDay -
        daysInMonth +
        1;

      date =
        new Date(
          year,
          month + 1,
          dayNumber
        );

      otherMonth = true;

    }


    // --------------------------------------------------------
    // CURRENT MONTH
    // --------------------------------------------------------

    else {

      dayNumber =
        i -
        firstDay +
        1;

      date =
        new Date(
          year,
          month,
          dayNumber
        );
    }


    // --------------------------------------------------------
    // CELL
    // --------------------------------------------------------

    const cell =
      document.createElement('div');

    cell.className =
      'day' +
      (
        otherMonth
          ? ' other'
          : ''
      ) +
      (
        sameDay(
          date,
          new Date()
        )
          ? ' today'
          : ''
      );


    // --------------------------------------------------------
    // DAY NUMBER
    // --------------------------------------------------------

    const number =
      document.createElement('div');

    number.className =
      'daynum';

    number.textContent =
      dayNumber;

    cell.appendChild(number);


    // --------------------------------------------------------
    // ADD EVENT ON CLICK
    // --------------------------------------------------------

    if (!otherMonth) {

      cell.onclick = () =>
        openAdd(
          formatDate(date)
        );
    }


    // --------------------------------------------------------
    // EVENTS FOR THIS DATE
    // --------------------------------------------------------

    const dateString =
      formatDate(date);

    let dayEvents =
      events.filter(
        e =>
          eventOccursOnDate(
            e,
            date
          )
      );


    // --------------------------------------------------------
    // CATEGORY FILTER
    // --------------------------------------------------------

    if (filter !== 'All') {

      dayEvents =
        dayEvents.filter(
          e =>
            e.category === filter
        );
    }


    // --------------------------------------------------------
    // DISPLAY EVENTS
    // --------------------------------------------------------

    dayEvents
      .sort(compareEvents)
      .forEach(event => {

        const el =
          document.createElement('div');

        el.className =
          'event ' +
          event.category;


        el.textContent =
          (
            event.startTime
              ? displayTime(
                  event.startTime
                ) + ' '
              : ''
          ) +
          event.title;


        el.title =
          event.title;


        el.onclick =
          ev => {

            ev.stopPropagation();

            openEdit(
              event.id
            );
          };


        cell.appendChild(el);
      });


    grid.appendChild(cell);
  }
}


// ============================================================
// UPCOMING EVENTS
// ============================================================

function renderUpcoming() {

  const container =
    $('upcoming');

  container.innerHTML = '';


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const upcoming = [];


  // Look ahead approximately one year
  const horizon =
    new Date(today);

  horizon.setDate(
    horizon.getDate() + 366
  );


  events.forEach(event => {

    const start =
      parseDate(
        event.startDate
      );

    const end =
      parseDate(
        event.endDate ||
        event.startDate
      );


    for (
      let d = new Date(today);
      d <= horizon;
      d.setDate(
        d.getDate() + 1
      )
    ) {

      const day =
        new Date(d);


      if (
        day < start ||
        day > end
      ) {
        continue;
      }


      if (
        eventOccursOnDate(
          event,
          day
        )
      ) {

        upcoming.push({

          ...event,

          _occurrenceDate:
            formatDate(day)
        });
      }
    }
  });


  // ----------------------------------------------------------
  // SORT
  // ----------------------------------------------------------

  upcoming.sort(
    (a, b) =>
      (
        a._occurrenceDate +
        ' ' +
        (a.startTime || '00:00')
      ).localeCompare(
        b._occurrenceDate +
        ' ' +
        (b.startTime || '00:00')
      )
  );


  // Only show first 10
  const visibleUpcoming =
    upcoming.slice(
      0,
      10
    );


  // ----------------------------------------------------------
  // NO EVENTS
  // ----------------------------------------------------------

  if (
    !visibleUpcoming.length
  ) {

    container.innerHTML =
      '<div class="up-meta">' +
      'No upcoming events.' +
      '</div>';

    return;
  }


  // ----------------------------------------------------------
  // DISPLAY
  // ----------------------------------------------------------

  visibleUpcoming.forEach(
    event => {

      const item =
        document.createElement(
          'div'
        );

      item.className =
        'up-item';


      item.onclick =
        () =>
          openEdit(
            event.id
          );


      const main =
        document.createElement(
          'div'
        );


      main.innerHTML =
        '<div class="up-title">' +
        escapeHtml(
          event.title
        ) +
        '</div>' +

        '<div class="up-meta">' +

        displayDate(
          event._occurrenceDate ||
          event.startDate
        ) +

        (
          event.startTime
            ? ' · ' +
              displayTime(
                event.startTime
              )
            : ''
        ) +

        (
          event.location
            ? ' · ' +
              escapeHtml(
                event.location
              )
            : ''
        ) +

        '</div>';


      const tag =
        document.createElement(
          'span'
        );

      tag.className =
        'tag ' +
        event.category;

      tag.textContent =
        categoryName(
          event.category
        );


      item.append(
        main,
        tag
      );

      container.appendChild(
        item
      );
    }
  );
}


// ============================================================
// ADD EVENT
// ============================================================

function openAdd(date) {

  editingId = null;

  $('modalTitle').textContent =
    'Add Event';

  $('eventForm').reset();

  $('eventId').value =
    '';

  $('deleteBtn').style.display =
    'none';


  const selectedDate =
    date ||
    formatDate(
      new Date()
    );


  $('startDate').value =
    selectedDate;

  $('endDate').value =
    selectedDate;


  $('modal').classList.remove(
    'hidden'
  );
}


// ============================================================
// EDIT EVENT
// ============================================================

function openEdit(id) {

  const event =
    events.find(
      e =>
        String(e.id) ===
        String(id)
    );


  if (!event) {
    return;
  }


  editingId =
    event.id;


  $('modalTitle').textContent =
    'Edit Event';


  $('eventId').value =
    event.id;


  $('title').value =
    event.title;


  $('category').value =
    event.category;


  $('startDate').value =
    event.startDate;


  $('endDate').value =
    event.endDate ||
    event.startDate;


  $('startTime').value =
    event.startTime ||
    '';


  $('endTime').value =
    event.endTime ||
    '';


  $('location').value =
    event.location ||
    '';


  $('description').value =
    event.description ||
    '';


  $('recurring').value =
    event.recurring ||
    'None';


  $('deleteBtn').style.display =
    'block';


  $('modal').classList.remove(
    'hidden'
  );
}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

  $('modal').classList.add(
    'hidden'
  );
}


// ============================================================
// SAVE EVENT
// ============================================================

async function saveEvent(e) {

  e.preventDefault();


  const event = {

    id:
      $('eventId').value,

    title:
      $('title').value.trim(),

    category:
      $('category').value,

    startDate:
      $('startDate').value,

    endDate:
      $('endDate').value ||
      $('startDate').value,

    startTime:
      $('startTime').value,

    endTime:
      $('endTime').value,

    location:
      $('location').value.trim(),

    description:
      $('description').value.trim(),

    recurring:
      $('recurring').value
  };


  if (
    !event.title ||
    !event.startDate
  ) {

    showToast(
      'Enter an event title and date.'
    );

    return;
  }


  if (
    API_URL.includes(
      'PASTE_'
    )
  ) {

    showToast(
      'Add your Apps Script /exec URL in app.js first.'
    );

    return;
  }


  showLoading();


  try {

    const result =
      await apiAction(
        editingId
          ? 'update'
          : 'add',
        event
      );


    if (!result.success) {

      throw new Error(
        result.message ||
        'Save failed.'
      );
    }


    closeModal();

    await wait(500);

    await loadEvents();


    showToast(
      editingId
        ? 'Event updated.'
        : 'Event added.'
    );

  } catch (err) {

    console.error(err);

    showToast(
      'Could not save event: ' +
      err.message
    );

  } finally {

    hideLoading();
  }
}


// ============================================================
// DELETE EVENT
// ============================================================

async function deleteCurrent() {

  if (!editingId) {
    return;
  }


  if (
    !confirm(
      'Delete this event?'
    )
  ) {
    return;
  }


  if (
    API_URL.includes(
      'PASTE_'
    )
  ) {

    showToast(
      'Add your Apps Script /exec URL in app.js first.'
    );

    return;
  }


  showLoading();


  try {

    const result =
      await apiAction(
        'delete',
        editingId
      );


    if (!result.success) {

      throw new Error(
        result.message ||
        'Delete failed.'
      );
    }


    closeModal();

    await wait(500);

    await loadEvents();


    showToast(
      'Event deleted.'
    );

  } catch (err) {

    console.error(err);

    showToast(
      'Could not delete event: ' +
      err.message
    );

  } finally {

    hideLoading();
  }
}


// ============================================================
// DATE HELPERS
// ============================================================

function parseDate(s) {

  const p =
    s.split('-');

  return new Date(
    +p[0],
    +p[1] - 1,
    +p[2]
  );
}


function formatDate(d) {

  return (
    d.getFullYear() +
    '-' +
    String(
      d.getMonth() + 1
    ).padStart(2, '0') +
    '-' +
    String(
      d.getDate()
    ).padStart(2, '0')
  );
}


function displayDate(s) {

  return parseDate(s)
    .toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );
}


function displayTime(s) {

  if (!s) {
    return '';
  }


  const p =
    s.split(':');


  let h =
    +p[0];


  const ap =
    h >= 12
      ? 'PM'
      : 'AM';


  h =
    h % 12 ||
    12;


  return (
    h +
    ':' +
    p[1] +
    ' ' +
    ap
  );
}


function sameDay(a, b) {

  return (
    a.getFullYear() ===
      b.getFullYear() &&

    a.getMonth() ===
      b.getMonth() &&

    a.getDate() ===
      b.getDate()
  );
}


function compareEvents(a, b) {

  return (
    a.startDate +
    ' ' +
    (a.startTime || '00:00')
  ).localeCompare(
    b.startDate +
    ' ' +
    (b.startTime || '00:00')
  );
}


// ============================================================
// CATEGORY NAMES
// ============================================================

function categoryName(c) {

  return ({

    Supervisor:
      'Supervisor',

    Viva:
      'Viva',

    Class:
      'Class',

    ExtraClass:
      'Extra Class',

    Exam:
      'Exam',

    Submission:
      'Submission',

    Office:
      'Office Work',

    Professor:
      'Professor Meeting',

    Conference:
      'Conference',

    Abstract:
      'Abstract',

    Presentation:
      'Presentation',

    LabHours:
      'Lab Hours',

    LabClass:
      'Lab Class',

    Other:
      'Other'

  })[c] || c;
}


// ============================================================
// SECURITY / UI HELPERS
// ============================================================

function escapeHtml(s) {

  return String(s)
    .replace(
      /[&<>"']/g,
      c => ({

        '&':
          '&amp;',

        '<':
          '&lt;',

        '>':
          '&gt;',

        '"':
          '&quot;',

        "'":
          '&#039;'

      }[c])
    );
}


function $(id) {

  return document.getElementById(
    id
  );
}


function showLoading() {

  $('loading')
    .classList
    .remove('hidden');
}


function hideLoading() {

  $('loading')
    .classList
    .add('hidden');
}


// ============================================================
// TOAST
// ============================================================

let toastTimer;


function showToast(message) {

  const toast =
    $('toast');


  toast.textContent =
    message;


  toast.style.display =
    'block';


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () =>
        toast.style.display =
          'none',
      3500
    );
}


// ============================================================
// WAIT
// ============================================================

function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}
