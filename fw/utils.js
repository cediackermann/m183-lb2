const escape = require('escape-html');

function sanitizeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe !== null && unsafe !== undefined ? unsafe : "");
  }

  // This handles the "Big 5" dangerous characters perfectly
  return escape(unsafe);
}

module.exports = { sanitizeHtml };