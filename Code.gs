// ─── CONFIG ───────────────────────────────────────────────────────────────────
// The access token needs RW for these fine grained scopes -> https://github.com/settings/tokens
// - Contents - to create/update files
// - Pull requests - to create PRs
// Store the token securely in Apps Script properties, via Project Settings → Script Properties.
const PROPS = PropertiesService.getScriptProperties().getProperties();
const GITHUB_TOKEN = PROPS["github-token"]; // Set this in Apps Script properties
const GITHUB_OWNER = "jwbensley";
const GITHUB_REPO  = "PR-Test";
const BASE_BRANCH  = "main";
const FILE_PATH    = "gform.csv"; // path in repo to create/update

// ─── TRIGGER ──────────────────────────────────────────────────────────────────

/**
 * Install this as the form submit trigger:
 * In Apps Script editor → Triggers (clock icon) → Add Trigger
 *   Function: onFormSubmit
 *   Event: From form → On form submit
 */
function onFormSubmit(e) {
  try {
    const responses = e.values;
    Logger.log("response items: %s", responses)

    // Build file content from form responses
    // First value is timestamp of submission
    const timestamp = responses[0].replace(/[:/ ]/g, "-");
    let title = "gform_" + timestamp; 
    let body = responses.slice(1).join();

    // Create a unique branch name using timestamp
    const branchName = title;

    // Run the GitHub flow
    const baseSha   = getBaseBranchSha();
    createBranch(branchName, baseSha);
    createFile(branchName, body, timestamp);
    const prUrl = createPullRequest(branchName, timestamp);

    Logger.log(`PR created: ${prUrl}`);
  } catch (err) {
    Logger.log(`Error: ${err.message}`);
    throw err;
  }
}

// ─── GITHUB HELPERS ───────────────────────────────────────────────────────────

function githubRequest(method, endpoint, payload) {
  const options = {
    method: method,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept":        "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      "Content-Type":  "application/json"
    },
    muteHttpExceptions: true
  };

  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  Logger.log("Payload: %s", payload)

  const url      = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
  const response = UrlFetchApp.fetch(url, options);
  const code     = response.getResponseCode();
  const json     = JSON.parse(response.getContentText());

  if (code < 200 || code >= 300) {
    throw new Error(`GitHub API error ${code}: ${json.message}`);
  }

  return json;
}

function getBaseBranchSha() {
  const data = githubRequest("GET", `/git/ref/heads/${BASE_BRANCH}`);
  return data.object.sha;
}

function createBranch(branchName, sha) {
  githubRequest("POST", "/git/refs", {
    ref: `refs/heads/${branchName}`,
    sha: sha
  });
}

function createFile(branchName, content, timestamp) {
  const encoded = Utilities.base64Encode(content);
  githubRequest("PUT", `/contents/${FILE_PATH}`, {
    message: `Form submission ${timestamp}`,
    content: encoded,
    branch:  branchName
  });
}

function createPullRequest(branchName, timestamp) {
  const data = githubRequest("POST", "/pulls", {
    title: `Form submission ${timestamp}`,
    head:  branchName,
    base:  BASE_BRANCH,
    body:  "Automated PR created from Google Form submission."
  });
  return data.html_url;
}