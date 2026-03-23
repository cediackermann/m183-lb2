import { searchV2 } from "./searchV2Controller.js";

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

  if (provider !== "/search/v2/") {
    return "Invalid provider";
  }

  // Set the terms in query for searchV2 to find them
  req.query.terms = terms;

  return await searchV2(req);
}