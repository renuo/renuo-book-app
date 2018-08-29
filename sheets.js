var CLIENT_ID = '502689268389-ahijjl56r21aueu32r30thdl78lf8euq.apps.googleusercontent.com';
var API_KEY = 'AIzaSyCWihXc4ivZp8NGVZ6XFcJgIk1Euq2XLLA';
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

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
    loadSheet();
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

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function appendProject(project) {
  const projectEl = $(`<li><span style="color: ${project.color};">█</span> ${project.name}</li>`);
  projectEl.data('project', project.name);
  projectEl.click(e => { $('td.selected').css('background-color', project.color) });
  $('#projects').append(projectEl);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function loadSheet() {
  gapi.client.sheets.spreadsheets.values.batchGet({
    spreadsheetId: '1VkzZSIgj9ksiNUHn_vWLGxYwAtVQkSzlTHH3ma9vtww',
    includeGridData: true,
    ranges: ['Projects!A:B', 'Assignments!A:I'],
  }).then(function(response) {
    const projectValues = response.result.valueRanges[0].values;
    const assignmentValues = response.result.valueRanges[0].values;

    projectValues.slice(1).forEach(row => {
      appendProject({name: row[0], color: row[1]});
    });

    assignmentValues.slice(1).forEach(row => {
      //appendProject({name: row[0], color: '#F00'});
    });
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}
