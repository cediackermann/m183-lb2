import escape from 'escape-html';
import header from './partials/header.js';
import footer from './partials/footer.js';

export function sanitizeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe !== null && unsafe !== undefined ? unsafe : "");
  }

  return escape(unsafe);
}

export async function wrapContent(content, req) {
  let headerHtml = await header(req);
  let footerHtml = footer();
  return headerHtml + content + footerHtml;
}

export default { sanitizeHtml, wrapContent };