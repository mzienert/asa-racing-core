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

// asset-input/src/functions/auth/define-auth-challenge/index.ts
var define_auth_challenge_exports = {};
__export(define_auth_challenge_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(define_auth_challenge_exports);
var handler = async (event) => {
  const { request } = event;
  if (request.userNotFound) {
    event.response = {
      isValid: false,
      failAuthentication: true,
      issueTokens: false
    };
    return event;
  }
  if (!request.session) {
    request.session = [];
  }
  if (request.session.length === 0) {
    event.response = {
      challengeName: "CUSTOM_CHALLENGE",
      issueTokens: false,
      failAuthentication: false
    };
  } else if (request.session.length === 1 && request.session[0].challengeName === "CUSTOM_CHALLENGE") {
    if (request.session[0].challengeResult === true) {
      event.response = {
        issueTokens: true,
        failAuthentication: false
      };
    } else {
      event.response = {
        issueTokens: false,
        failAuthentication: true
      };
    }
  } else {
    event.response = {
      issueTokens: false,
      failAuthentication: true
    };
  }
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
