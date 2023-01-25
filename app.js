const express = require("express");
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();
const { auth, requiresAuth } = require("express-openid-connect");

//initialize the express-openid-connect
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET,
    idpLogout: true,
  })
);

// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

// The /profile route will show the user profile as JSON
app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

// checkPermission middleware that lets you check 
// whether user authorized to perform specific action 
const checkPermissions = (permissionType) => {
  return async (req, res, next) => {

    // get authenticated user information from auth0
    const userInfo = await req.oidc.user;
    req.userInfo = userInfo
    console.log('userInfo', userInfo)
    
    // body params of Permify check request
    const bodyParams = {
      metadata: {
        schema_version: "",
        snap_token: "",
        depth: 20,
      },
      entity: {
        type: "document",
        id: req.params.id,
      },
      permission: permissionType,
      subject: {
        type: "user",
        id: userInfo.sid, // user id on auth0
        relation: "",
      },
    };

    // performing the check request
    const checkRes = await fetch("http://localhost:3476/v1/permissions/check", {
      method: "POST",
      body: JSON.stringify(bodyParams),
      headers: { "Content-Type": "application/json" },
    })
    .catch((err) => {
      res.status(500).send(err);
    });
    
    let checkResJson = await checkRes.json()
    console.log('Check Result:', checkResJson)

    if (checkResJson.can == "RESULT_ALLOWED") {
        // if user authorized
        req.authorized = "authorized";
        next();
    } 

    // if user not authorized
    req.authorized = "not authorized";
    next();
  };
};

// view the document
app.get("/docs/:id", checkPermissions("view"), requiresAuth(), (req, res) => {

  /// Result
  res.send(`User:${req.userInfo.sid} is ${req.authorized} to view document:${req.params.id}`);

});

// edit the resource
app.put("/docs/:id", checkPermissions("edit"), requiresAuth(), (req, res) => {
 
  // Result
  res.send(`User:${req.userInfo.sid} to edit document:${req.params.id}`);

});

// delete the resource
app.delete("/docs/:id", checkPermissions("delete"), requiresAuth(), (req, res) => {

  // Result
  res.send(`User:${req.userInfo.sid} to delete document:${req.params.id}`);

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
