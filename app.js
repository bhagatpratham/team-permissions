const express = require("express");
const app = express();
require("dotenv").config();
const { auth, requiresAuth } = require("express-openid-connect");

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

function getUserData(req, res, next) {
  const userId = req.headers.userId;
  fetch(`localhost:3476/v1/permissions/check`)
    .then((response) => response.json())
    .then((data) => {
      req.userData = data;
      next();
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

function checkPermissions(req, res, next) {
  const userId = req.headers.userId;
  req.userId = userId;
  const body = { userId };
  fetch("http://localhost:3476/v1/permissions/check", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      req.permissions = data;
      next();
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}
app.use(checkPermissions());

// GET /teams?id/resources API route to list resources of specific team

app.get("/teams?id/resources", checkPermissions, (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  res.send(`
   {
   "metadata": {
     "schema_version": "",
     "snap_token": "",
     "depth": 20
   },
   "entity": {
     "type": "team",
     "id": "1"
   },
   "permission": "list_resources",
   "subject": {
     "type": "user",
     "id": ${req.userId},
     "relation": ""
   },
 }`);
});

// GET /teams?id/resources?id API route to view resource

app.get("/resources?id", checkPermissions, (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  res.send(`
   {
   "metadata": {
     "schema_version": "",
     "snap_token": "",
     "depth": 20
   },
   "entity": {
     "type": "team",
     "id": "1"
   },
   "permission": "view",
   "subject": {
     "type": "user",
     "id": ${req.userId},
     "relation": ""
   },
   
 }`);
});

// PUT /resources?id API route to edit resource
app.put("/resources?id", checkPermissions, (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  res.send(`
  {
  "metadata": {
    "schema_version": "",
    "snap_token": "",
    "depth": 20
  },
  "entity": {
    "type": "team",
    "id": "1"
  },
  "permission": "edit",
  "subject": {
    "type": "user",
    "id": ${req.userId},
    "relation": ""
  },
}
`);
});

// DELETE /resources?id API route to delete the resource

app.delete("/resources?id", (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  res.send(`
    {
    "metadata": {
      "schema_version": "",
      "snap_token": "",
      "depth": 20
    },
    "entity": {
      "type": "team",
      "id": "1"
    },
    "permission": "delete",
    "subject": {
      "type": "user",
      "id": ${req.userId},
      "relation": ""
    },
  }`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
