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

// asset-input/src/functions/auth/create-auth-challenge/index.ts
var create_auth_challenge_exports = {};
__export(create_auth_challenge_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(create_auth_challenge_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_ses = require("@aws-sdk/client-ses");
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProvider({ region: "us-west-1" });
var ses = new import_client_ses.SESClient({ region: "us-west-1" });
var handler = async (event) => {
  let secretLoginCode;
  if (!event.request.session || !event.request.session.length) {
    secretLoginCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    try {
      await ses.send(new import_client_ses.SendEmailCommand({
        Destination: {
          ToAddresses: [event.request.userAttributes.email]
        },
        Message: {
          Body: {
            Text: {
              Data: `Your ASA Racing verification code is: ${secretLoginCode}`
            }
          },
          Subject: {
            Data: "Your ASA Racing Verification Code"
          }
        },
        Source: "admin@asaracing.live"
      }));
      event.response.privateChallengeParameters = {
        secretLoginCode
      };
      event.response.publicChallengeParameters = {
        email: event.request.userAttributes.email
      };
      event.response.challengeMetadata = "CUSTOM_CHALLENGE";
    } catch (error) {
      console.error("Error in create-auth-challenge:", error);
      throw error;
    }
  } else {
    const lastSession = event.request.session.slice(-1)[0];
    secretLoginCode = lastSession?.challengeMetadata || "INVALID";
    event.response.privateChallengeParameters = {
      secretLoginCode
    };
    event.response.challengeMetadata = "CUSTOM_CHALLENGE";
  }
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
