"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// asset-input/src/functions/auth/verify-auth-challenge/index.ts
var verify_auth_challenge_exports = {};
__export(verify_auth_challenge_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(verify_auth_challenge_exports);
var handler = async (event) => {
  const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode;
  const providedAnswer = event.request.challengeAnswer;
  event.response.answerCorrect = expectedAnswer === providedAnswer;
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
