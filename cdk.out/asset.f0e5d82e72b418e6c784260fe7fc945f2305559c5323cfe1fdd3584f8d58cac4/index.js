"use strict";var i=Object.create;var t=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var u=Object.getPrototypeOf,p=Object.prototype.hasOwnProperty;var h=(e,s)=>{for(var r in s)t(e,r,{get:s[r],enumerable:!0})},n=(e,s,r,l)=>{if(s&&typeof s=="object"||typeof s=="function")for(let a of g(s))!p.call(e,a)&&a!==r&&t(e,a,{get:()=>s[a],enumerable:!(l=c(s,a))||l.enumerable});return e};var m=(e,s,r)=>(r=e!=null?i(u(e)):{},n(s||!e||!e.__esModule?t(r,"default",{value:e,enumerable:!0}):r,e)),d=e=>n(t({},"__esModule",{value:!0}),e);var q={};h(q,{handler:()=>C});module.exports=d(q);var o=m(require("crypto")),C=async e=>{let s;return!e.request.session||!e.request.session.length?s=o.randomInt(1e5,999999).toString():s=e.request.session.slice(-1)[0].challengeMetadata,e.response={publicChallengeParameters:{email:e.request.userAttributes.email},privateChallengeParameters:{secretLoginCode:s},challengeMetadata:s},e};0&&(module.exports={handler});
//# sourceMappingURL=index.js.map
