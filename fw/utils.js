const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(unsafe) {
  if (typeof unsafe !== "string") {
    unsafe = String(unsafe !== null && unsafe !== undefined ? unsafe : "");
  }
  return DOMPurify.sanitize(unsafe);
}

module.exports = {
  sanitizeHtml
};
