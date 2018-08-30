const CLIENT_ID = '502689268389-ahijjl56r21aueu32r30thdl78lf8euq.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCWihXc4ivZp8NGVZ6XFcJgIk1Euq2XLLA';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const SPREADSHEET_ID = '1VkzZSIgj9ksiNUHn_vWLGxYwAtVQkSzlTHH3ma9vtww';

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const saveButton = document.getElementById('save_button');

const projectsList = $('#projects-list');
const assignmentsTable = $('#assignments-table');

let projects = [];
let workers = [];

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    saveButton.onclick = handleSaveClick;
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    saveButton.style.display = 'block';

    loadProjects().then(loadWorkers);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    saveButton.style.display = 'none';
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function handleSaveClick(event) {
  saveAllAssignments();
}

function appendDatesRow(dates) {
  const tr = $('<tr class="header-row"><th class="header-col"></th></tr>');
  let dayCount = 0;
  dates.forEach(date => {
    const th = $('<th/>');
    const parts = date.split('-');
    th.append(`<div class="year-${parts[0]}">${parts[0]}</div>`);
    th.append(`<div class="month-${parts[1]}">${parts[1]}</div>`);
    th.append(`<div class="day-${parts[2]} day-group-${Math.floor(dayCount++ / 5) % 4}">${parts[2]}</div>`);
    tr.append(th);
  });
  assignmentsTable.append(tr);
}

function appendAssignmentRow(worker) {
  const tr = $('<tr/>');

  tr.data('worker', worker.name);
  tr.append(`<th class="header-col">${worker.name}</th>`);

  worker.assignments.forEach((assignment, index) => {
    const project = projects.find(p => p.name === assignment);
    const td = $(`<td class="${index % 5 === 4 ? 'group-end-cell' : '' }"/>`);

    if (project) {
      td.data('day', index) // TODO: shouldnt be index based probably
        .data('project', project)
        .css('background-color', project.color);
    }

    tr.append(td);
  });

  assignmentsTable.append(tr);
}

function appendProject(project) {
  const projectEl = $(`<li><div class="color-button" style="background-color: ${project.color};"></div> ${project.name}</li>`);
  projectEl.data('project', project.name);
  projectEl.click(e => {
    const cells = $('td.selected')
      .data('project', project)
      .css('background-color', project.color)
      .removeClass("selected");
  });
  projectsList.append(projectEl);
}

function loadProjects() {
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    majorDimension: 'ROWS',
    range: 'Projects!A:B'
  }).then(function(response) {
    const projectRows = response.result.values.slice(1);
    projects = projectRows.map(row => ({name: row[0], color: row[1]}));
    projects.forEach(p => appendProject(p));
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}

function loadWorkers() {
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    majorDimension: 'COLUMNS',
    range: 'Assignments!A:J'
  }).then(function(response) {
    const datesColumn = response.result.values[0];
    appendDatesRow(datesColumn.slice(1));

    const assignmentColumns = response.result.values.slice(1);
    workers = assignmentColumns.map(col => {
      const zeroPadding = (new Array(datesColumn.length - col.length)).fill(undefined);
      return {name: col[0], assignments: col.concat(zeroPadding).slice(1)}
    });
    workers.forEach(w => appendAssignmentRow(w));

    initializeSelector(assignmentsTable);
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}

function saveAllAssignments() {
  const values = assignmentsTable.children('tr').slice(1).map((i, rowEl) => {
    return [$(rowEl).children('td').map((j, cellEl) => {
      const project = $(cellEl).data('project');
      if (project) {
        return project.name
      } else {
        return undefined;
      }
    }).get()];
  }).get();

  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Assignments!B2:J',
    valueInputOption: 'RAW',
    resource: { values: values, majorDimension: 'COLUMNS' }
  }).then((response) => {
    console.log(`${response.result.updatedCells} cells updated.`);
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}
