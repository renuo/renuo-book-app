const CLIENT_ID = '502689268389-ahijjl56r21aueu32r30thdl78lf8euq.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCWihXc4ivZp8NGVZ6XFcJgIk1Euq2XLLA';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');

const projectsList = $('#projects');
const assignmentsTable = $('#table');

let projects = [];
let workers = [];

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
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
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    loadProjects().then(loadWorkers);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function appendDatesRow(dates) {
  const tr = $('<tr><th></th></tr>');
  dates.forEach(date => {
    //const isoDateString = date.toISOString().slice(0, 10);
    tr.append($(`<th>${date}</th>`))
  });
  assignmentsTable.append(tr);
}

function appendAssignmentRow(worker) {
  const tr = $('<tr/>');

  tr.data('worker', worker.name);
  tr.append(`<th>${worker.name}</th>`);

  worker.assignments.forEach((assignment, index) => {
    const project = projects.find(p => p.name === assignment);
    const td = $('<td/>');

    if (project) {
      td.data('day', index); // TODO: shouldnt be index based probably
      td.data('project', project);
      td.css('background-color', project.color);
    }

    tr.append(td);
  });

  assignmentsTable.append(tr);
}

function appendProject(project) {
  const projectEl = $(`<li><span style="color: ${project.color};">█</span> ${project.name}</li>`);
  projectEl.data('project', project.name);
  projectEl.click(e => { $('td.selected').css('background-color', project.color) });
  projectsList.append(projectEl);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function loadProjects() {
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1VkzZSIgj9ksiNUHn_vWLGxYwAtVQkSzlTHH3ma9vtww',
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
    spreadsheetId: '1VkzZSIgj9ksiNUHn_vWLGxYwAtVQkSzlTHH3ma9vtww',
    majorDimension: 'COLUMNS',
    range: 'Assignments!A:I'
  }).then(function(response) {
    const datesColumn = response.result.values[0];
    appendDatesRow(datesColumn.slice(1));

    const assignmentColumns = response.result.values.slice(1);
    workers = assignmentColumns.map(col => {
      const zeroPadding = (new Array(datesColumn.length - col.length)).fill(undefined);
      return {name: col[0], assignments: col.concat(zeroPadding).slice(1)}
    });
    workers.forEach(w => appendAssignmentRow(w));

    initializeSelector($('#table'));
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}
