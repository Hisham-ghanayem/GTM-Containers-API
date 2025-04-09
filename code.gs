/**
 * Adds a custom menu item to the Google Sheets UI when the document is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('GTM Versions')
    .addItem('Open Sidebar', 'showSidebar')
    .addToUi();
}

/**
 * Opens the sidebar UI where the user can select GTM account and fetch versions.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Fetch GTM Versions');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Fetches a list of all GTM accounts accessible to the authenticated user.
 * @returns {Array} List of account objects from GTM API.
 */
function getAccounts() {
  const accessToken = ScriptApp.getOAuthToken();
  const url = 'https://www.googleapis.com/tagmanager/v2/accounts';
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const json = JSON.parse(response.getContentText());
  return json.account || [];
}

/**
 * Fetches the first container found within the specified GTM account.
 * @param {string} accountId - The GTM account ID.
 * @returns {Object|null} The first container object or null if not found.
 */
function getFirstContainer(accountId) {
  const accessToken = ScriptApp.getOAuthToken();
  const url = `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const json = JSON.parse(response.getContentText());
  return json.container?.[0];
}

/**
 * Fetches all versions for a specific container in a GTM account.
 * @param {string} accountId - The GTM account ID.
 * @param {string} containerId - The container ID.
 * @returns {Array} List of version objects for the container.
 */
function getContainerVersions(accountId, containerId) {
  const accessToken = ScriptApp.getOAuthToken();
  const url = `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/versions`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const json = JSON.parse(response.getContentText());
  return json.versions || [];
}

/**
 * Writes all GTM container versions for the first container of the selected account into a Google Sheet.
 * If the "Versions" sheet does not exist, it is created. The sheet is cleared before writing new data.
 * @param {string} accountId - The GTM account ID to fetch versions for.
 * @returns {string} A confirmation message after writing to the sheet.
 */
function writeVersionsToSheet(accountId) {
  const container = getFirstContainer(accountId);
  if (!container) return "No container found.";

  const versions = getContainerVersions(accountId, container.containerId);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Versions")
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Versions");

  sheet.clearContents();
  sheet.appendRow(["Version Name", "Description"]);

  versions.forEach(version => {
    const v = version.containerVersion;
    sheet.appendRow([v.name || "No name", v.description || ""]);
  });

  return "✅ Versions written to sheet!";
}
