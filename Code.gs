const SHEET_NAME = 'Events';

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = p.action || 'events';

  try {
    let result;

    if (action === 'events') {
      result = { success: true, events: getEvents() };
    } else if (action === 'add') {
      result = addEvent(JSON.parse(p.data || '{}'));
    } else if (action === 'update') {
      result = updateEvent(JSON.parse(p.data || '{}'));
    } else if (action === 'delete') {
      result = deleteEvent(p.id);
    } else if (action === 'setup') {
      setupCalendar();
      result = { success: true, message: 'Calendar database is ready.' };
    } else {
      result = { success: false, message: 'Unknown action.' };
    }

    return output(result, p.prefix);

  } catch (err) {
    return output({ success: false, message: err.message }, p.prefix);
  }
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || '';
    let result;

    if (action === 'add') {
      result = addEvent(JSON.parse(p.data || '{}'));
    } else if (action === 'update') {
      result = updateEvent(JSON.parse(p.data || '{}'));
    } else if (action === 'delete') {
      result = deleteEvent(p.id);
    } else {
      result = { success: false, message: 'Unknown action.' };
    }

    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({ success: false, message: err.message });
  }
}

function output(obj, prefix) {
  const payload = JSON.stringify(obj);
  if (prefix) {
    return ContentService
      .createTextOutput(prefix + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput(obj);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupCalendar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = [
    'ID','Title','Category','Start Date','Start Time',
    'End Date','End Time','Location','Description',
    'Recurring','Created At','Updated At'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function getEvents() {
  setupCalendar();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];

  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,12).getValues();

  return rows.filter(r => r[0]).map(r => ({
    id: String(r[0]),
    title: r[1] || '',
    category: r[2] || 'Other',
    startDate: formatDate(r[3]),
    startTime: formatTime(r[4]),
    endDate: formatDate(r[5]),
    endTime: formatTime(r[6]),
    location: r[7] || '',
    description: r[8] || '',
    recurring: r[9] || 'None'
  }));
}

function addEvent(event) {
  setupCalendar();
  validateEvent(event);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const id = Utilities.getUuid();
  const now = new Date();

  sheet.appendRow([
    id,
    event.title,
    event.category,
    parseDate(event.startDate),
    event.startTime || '',
    parseDate(event.endDate || event.startDate),
    event.endTime || '',
    event.location || '',
    event.description || '',
    event.recurring || 'None',
    now,
    now
  ]);

  return { success: true, id: id };
}

function updateEvent(event) {
  setupCalendar();
  validateEvent(event);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(event.id)) {
      sheet.getRange(i+1,1,1,12).setValues([[
        event.id,
        event.title,
        event.category,
        parseDate(event.startDate),
        event.startTime || '',
        parseDate(event.endDate || event.startDate),
        event.endTime || '',
        event.location || '',
        event.description || '',
        event.recurring || 'None',
        rows[i][10],
        new Date()
      ]]);
      return { success: true };
    }
  }

  throw new Error('Event not found.');
}

function deleteEvent(id) {
  setupCalendar();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i+1);
      return { success: true };
    }
  }

  throw new Error('Event not found.');
}

function validateEvent(event) {
  if (!event || !event.title || !event.title.trim()) {
    throw new Error('Event title is required.');
  }
  if (!event.category) {
    throw new Error('Category is required.');
  }
  if (!event.startDate) {
    throw new Error('Start date is required.');
  }
}

function parseDate(value) {
  const p = value.split('-');
  return new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
}

function formatDate(value) {
  if (!value) return '';
  if (!(value instanceof Date)) return String(value);
  return Utilities.formatDate(
    value,
    Session.getScriptTimeZone() || 'Asia/Kolkata',
    'yyyy-MM-dd'
  );
}

function formatTime(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || 'Asia/Kolkata',
      'HH:mm'
    );
  }
  return String(value);
}