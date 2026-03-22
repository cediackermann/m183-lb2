import axios from "axios";
const { post, put, get } = axios;
import { stringify } from "querystring";

export async function search(req) {
  if (
    req.body.provider === undefined ||
    req.body.terms === undefined ||
    !req.session ||
    !req.session.userid
  ) {
    return "Not enough information provided";
  }

  let provider = req.body.provider;
  let terms = req.body.terms;
  let userid = req.session.userid;

  if (provider !== "/search/v2/") {
    return "Invalid provider";
  }

  await sleep(10);

  let queryParams = new URLSearchParams({
    terms: terms
  }).toString();

  let theUrl = "http://localhost:3000" + provider + "?" + queryParams;
  let result = await callAPI("GET", theUrl, false, req);
  return result;
}

async function callAPI(method, url, data, req) {
  let noResults = "No results found!";
  let result;
  let config = {};
  if (req && req.headers && req.headers.cookie) {
    config.headers = { Cookie: req.headers.cookie };
  }

  switch (method) {
    case "POST":
      if (data) {
        result = await post(url, data, config)
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            return noResults;
          });
      } else {
        result = await post(url, null, config)
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            return noResults;
          });
      }
      break;
    case "PUT":
      if (data) {
        result = await put(url, data, config)
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            return noResults;
          });
      } else {
        result = await put(url, null, config)
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            return noResults;
          });
      }
      break;
    default:
      if (data) url = url + "?" + stringify(data);

      result = await get(url, config)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          return noResults;
        });
  }

  return result ? result : noResults;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}