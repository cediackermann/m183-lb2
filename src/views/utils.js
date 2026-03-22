const escape = require('escape-html');
const header = require('./partials/header');
const footer = require('./partials/footer');

function sanitizeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe !== null && unsafe !== undefined ? unsafe : "");
  }

  // This handles the "Big 5" dangerous characters perfectly
  return escape(unsafe);
}

async function wrapContent(content, req) {
  let headerHtml = await header(req);
  return headerHtml + content + footer;
}

module.exports = { sanitizeHtml, wrapContent };