// ============================================================
// ACADEMIC CALENDAR PWA
// ============================================================

// PUT YOUR GOOGLE APPS SCRIPT /exec URL HERE
const API_URL =
  'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';


let events = [];
let currentDate = new Date();
let editingId = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  function () {

    console.log('Academic Calendar JS loaded.');

    registerServiceWorker();

    setupButtons();

    loadEvents();

  }
);


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

  document
    .getElementById('addBtn')
    .onclick = function () {

      openAdd();

    };


  document
    .getElementById('prevBtn')
    .onclick = function () {

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );

      render();

    };


  document
    .getElementById('nextBtn')
    .onclick = function () {

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );

      render();

    };


  document
    .getElementById('todayBtn')
    .onclick = function () {

      currentDate = new Date();

      render();

    };


  document
    .getElementById('filter')
    .onchange = function () {

      render();

    };


  document
    .getElementById('closeBtn')
    .onclick = closeModal;


  document
    .getElementById('cancelBtn')
    .onclick = closeModal;


  document
    .getElementById('deleteBtn')
    .onclick =
      deleteCurrent;


  document
    .getElementById('eventForm')
    .onsubmit =
      saveEvent;


  document
    .getElementById('modal')
    .onclick = function (e) {

      if (
        e.target ===
        document.getElementById('modal')
      ) {

        closeModal();

      }

    };

}


// ============================================================
// SERVICE WORKER
// ============================================================

function registerServiceWorker() {

  if (
    'serviceWorker' in navigator
  ) {

    navigator
      .serviceWorker
      .register('./sw.js')
      .then(function () {

        console.log(
          'Service worker registered.'
        );

      })
      .catch(function (error) {

        console.error(
          'Service worker error:',
          error
        );

      });

  }

}


// ============================================================
// LOAD EVENTS
// ============================================================

function loadEvents() {

  console.log(
    'Loading events...'
  );


  // ----------------------------------------------------------
  // Check API URL
  // ----------------------------------------------------------

  if (
    API_URL.includes('PASTE_')
  ) {

    console.warn(
      'Apps Script URL has not been added.'
    );


    events = JSON.parse(
      localStorage.getItem(
        'calendarEvents'
      ) || '[]'
    );


    render();

    hideLoading();

    return;

  }


  showLoading();


  jsonp(
    API_URL +
    '?action=events'
  )

    .then(function (data) {

      console.log(
        'API response:',
        data
      );


      if (
        !data.success
      ) {

        throw new Error(
          data.message ||
          'Unable to load events.'
        );

      }


      events =
        data.events || [];


      localStorage.setItem(
        'calendarEvents',
        JSON.stringify(events)
      );


      render();

    })


    .catch(function (error) {

      console.error(
        'API ERROR:',
        error
      );


      events = JSON.parse(
        localStorage.getItem(
          'calendarEvents'
        ) || '[]'
      );


      render();


      showToast(
        'Using offline calendar data.'
      );

    })


    .finally(function () {

      hideLoading();

    });

}


// ============================================================
// JSONP
// ============================================================

function jsonp(url) {

  return new Promise(
    function (resolve, reject) {

      const callbackName =
        'calendarCallback_' +
        Date.now();


      const script =
        document.createElement(
          'script'
        );


      const timeout =
        setTimeout(
          function () {

            cleanup();

            reject(
              new Error(
                'Apps Script request timed out.'
              )
            );

          },
          15000
        );


      window[callbackName] =
        function (data) {

          clearTimeout(
            timeout
          );

          cleanup();

          resolve(data);

        };


      script.onerror =
        function () {

          clearTimeout(
            timeout
          );

          cleanup();

          reject(
            new Error(
              'Could not connect to Apps Script.'
            )
          );

        };


      script.src =
        url +
        '&prefix=' +
        encodeURIComponent(
          callbackName
        );


      document
        .head
        .appendChild(script);


      function cleanup() {

        delete window[
          callbackName
        ];

        script.remove();

      }

    }
  );

}


// ============================================================
// RENDER EVERYTHING
// ============================================================

function render() {

  renderCalendar();

  renderUpcoming();

}


// ============================================================
// CALENDAR
// ============================================================

function renderCalendar() {

  console.log(
    'Rendering calendar...'
  );


  const year =
    currentDate.getFullYear();


  const month =
    currentDate.getMonth();


  const monthTitle =
    currentDate.toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric'
      }
    );


  document.getElementById(
    'monthTitle'
  ).textContent =
    monthTitle;


  const grid =
    document.getElementById(
      'calendarGrid'
    );


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
      (
        firstDay +
        daysInMonth
      ) / 7
    ) * 7;


  const filter =
    document.getElementById(
      'filter'
    ).value;


  for (
    let i = 0;
    i < totalCells;
    i++
  ) {

    let date;

    let dayNumber;

    let otherMonth = false;


    if (
      i < firstDay
    ) {

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

    else if (
      i >=
      firstDay +
      daysInMonth
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


    const cell =
      document.createElement(
        'div'
      );


    cell.className =
      'day';


    if (otherMonth) {

      cell.classList.add(
        'other'
      );

    }


    if (
      isSameDay(
        date,
        new Date()
      )
    ) {

      cell.classList.add(
        'today'
      );

    }


    const number =
      document.createElement(
        'div'
      );


    number.className =
      'daynum';


    number.textContent =
      dayNumber;


    cell.appendChild(
      number
    );


    if (!otherMonth) {

      cell.onclick =
        function () {

          openAdd(
            formatDate(date)
          );

        };

    }


    const dateString =
      formatDate(date);


    let dayEvents =
      events.filter(
        function (event) {

          return (
            event.startDate ===
            dateString
          );

        }
      );


    if (
      filter !== 'All'
    ) {

      dayEvents =
        dayEvents.filter(
          function (event) {

            return (
              event.category ===
              filter
            );

          }
        );

    }


    dayEvents
      .sort(compareEvents)
      .forEach(
        function (event) {

          const element =
            document.createElement(
              'div'
            );


          element.className =
            'event ' +
            event.category;


          element.textContent =
            (
              event.startTime
                ? displayTime(
                    event.startTime
                  ) + ' '
                : ''
            ) +
            event.title;


          element.title =
            event.title;


          element.onclick =
            function (e) {

              e.stopPropagation();

              openEdit(
                event.id
              );

            };


          cell.appendChild(
            element
          );

        }
      );


    grid.appendChild(
      cell
    );

  }

}


// ============================================================
// UPCOMING
// ============================================================

function renderUpcoming() {

  const container =
    document.getElementById(
      'upcoming'
    );


  container.innerHTML = '';


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const upcoming =
    events
      .filter(
        function (event) {

          return (
            parseDate(
              event.startDate
            ) >= today
          );

        }
      )
      .sort(
        compareEvents
      )
      .slice(
        0,
        10
      );


  if (
    upcoming.length === 0
  ) {

    container.innerHTML =
      '<div class="up-meta">' +
      'No upcoming events.' +
      '</div>';

    return;

  }


  upcoming.forEach(
    function (event) {

      const item =
        document.createElement(
          'div'
        );


      item.className =
        'up-item';


      item.onclick =
        function () {

          openEdit(
            event.id
          );

        };


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


      item.appendChild(
        main
      );


      item.appendChild(
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


  document.getElementById(
    'modalTitle'
  ).textContent =
    'Add Event';


  document.getElementById(
    'eventForm'
  ).reset();


  document.getElementById(
    'eventId'
  ).value =
    '';


  document.getElementById(
    'deleteBtn'
  ).style.display =
    'none';


  const selectedDate =
    date ||
    formatDate(
      new Date()
    );


  document.getElementById(
    'startDate'
  ).value =
    selectedDate;


  document.getElementById(
    'endDate'
  ).value =
    selectedDate;


  document.getElementById(
    'modal'
  ).classList.remove(
    'hidden'
  );

}


// ============================================================
// EDIT EVENT
// ============================================================

function openEdit(id) {

  const event =
    events.find(
      function (item) {

        return (
          String(item.id) ===
          String(id)
        );

      }
    );


  if (!event) return;


  editingId =
    event.id;


  document.getElementById(
    'modalTitle'
  ).textContent =
    'Edit Event';


  document.getElementById(
    'eventId'
  ).value =
    event.id;


  document.getElementById(
    'title'
  ).value =
    event.title;


  document.getElementById(
    'category'
  ).value =
    event.category;


  document.getElementById(
    'startDate'
  ).value =
    event.startDate;


  document.getElementById(
    'endDate'
  ).value =
    event.endDate ||
    event.startDate;


  document.getElementById(
    'startTime'
  ).value =
    event.startTime ||
    '';


  document.getElementById(
    'endTime'
  ).value =
    event.endTime ||
    '';


  document.getElementById(
    'location'
  ).value =
    event.location ||
    '';


  document.getElementById(
    'description'
  ).value =
    event.description ||
    '';


  document.getElementById(
    'recurring'
  ).value =
    event.recurring ||
    'None';


  document.getElementById(
    'deleteBtn'
  ).style.display =
    'block';


  document.getElementById(
    'modal'
  ).classList.remove(
    'hidden'
  );

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

  document.getElementById(
    'modal'
  ).classList.add(
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
      document.getElementById(
        'eventId'
      ).value,

    title:
      document.getElementById(
        'title'
      ).value.trim(),

    category:
      document.getElementById(
        'category'
      ).value,

    startDate:
      document.getElementById(
        'startDate'
      ).value,

    endDate:
      document.getElementById(
        'endDate'
      ).value,

    startTime:
      document.getElementById(
        'startTime'
      ).value,

    endTime:
      document.getElementById(
        'endTime'
      ).value,

    location:
      document.getElementById(
        'location'
      ).value.trim(),

    description:
      document.getElementById(
        'description'
      ).value.trim(),

    recurring:
      document.getElementById(
        'recurring'
      ).value

  };


  if (
    !event.endDate
  ) {

    event.endDate =
      event.startDate;

  }


  if (
    !event.title ||
    !event.startDate
  ) {

    showToast(
      'Enter a title and date.'
    );

    return;

  }


  showLoading();


  try {

    const params =
      new URLSearchParams();


    params.set(
      'action',
      editingId
        ? 'update'
        : 'add'
    );


    params.set(
      'data',
      JSON.stringify(
        event
      )
    );


    await fetch(
      API_URL,
      {
        method: 'POST',
        body: params
      }
    );


    closeModal();


    await wait(
      1000
    );


    loadEvents();


    showToast(
      editingId
        ? 'Event updated.'
        : 'Event added.'
    );

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      'Could not save event.'
    );

  }

  finally {

    hideLoading();

  }

}


// ============================================================
// DELETE
// ============================================================

async function deleteCurrent() {

  if (!editingId) return;


  if (
    !confirm(
      'Delete this event?'
    )
  ) {

    return;

  }


  showLoading();


  try {

    const params =
      new URLSearchParams();


    params.set(
      'action',
      'delete'
    );


    params.set(
      'id',
      editingId
    );


    await fetch(
      API_URL,
      {
        method: 'POST',
        body: params
      }
    );


    closeModal();


    await wait(
      1000
    );


    loadEvents();


    showToast(
      'Event deleted.'
    );

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      'Could not delete event.'
    );

  }

  finally {

    hideLoading();

  }

}


// ============================================================
// HELPERS
// ============================================================

function parseDate(
  value
) {

  const parts =
    value.split('-');


  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

}


function formatDate(
  date
) {

  const y =
    date.getFullYear();


  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );


  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return (
    y +
    '-' +
    m +
    '-' +
    d
  );

}


function displayDate(
  value
) {

  return parseDate(
    value
  ).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  );

}


function displayTime(
  value
) {

  if (!value) return '';


  const parts =
    value.split(':');


  let hour =
    Number(parts[0]);


  const minute =
    parts[1];


  const ampm =
    hour >= 12
      ? 'PM'
      : 'AM';


  hour =
    hour % 12 ||
    12;


  return (
    hour +
    ':' +
    minute +
    ' ' +
    ampm
  );

}


function isSameDay(
  a,
  b
) {

  return (
    a.getFullYear() ===
      b.getFullYear() &&

    a.getMonth() ===
      b.getMonth() &&

    a.getDate() ===
      b.getDate()
  );

}


function compareEvents(
  a,
  b
) {

  return (
    a.startDate +
    ' ' +
    (a.startTime ||
      '00:00')
  ).localeCompare(
    b.startDate +
    ' ' +
    (b.startTime ||
      '00:00')
  );

}


function categoryName(
  category
) {

  const names = {

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

  };


  return (
    names[category] ||
    category
  );

}


function escapeHtml(
  text
) {

  return String(
    text
  ).replace(
    /[&<>"']/g,
    function (char) {

      return {

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'

      }[char];

    }
  );

}


function showLoading() {

  document
    .getElementById(
      'loading'
    )
    .classList.remove(
      'hidden'
    );

}


function hideLoading() {

  document
    .getElementById(
      'loading'
    )
    .classList.add(
      'hidden'
    );

}


function showToast(
  message
) {

  const toast =
    document.getElementById(
      'toast'
    );


  toast.textContent =
    message;


  toast.style.display =
    'block';


  clearTimeout(
    window.toastTimer
  );


  window.toastTimer =
    setTimeout(
      function () {

        toast.style.display =
          'none';

      },
      3000
    );

}


function wait(
  milliseconds
) {

  return new Promise(
    function (resolve) {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );

}
