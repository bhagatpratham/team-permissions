const express = require("express");
const app = express();
require("dotenv").config();
const { auth, requiresAuth } = require("express-openid-connect");
const auth0 = require("auth0");

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

const auth0Client = new auth0.AuthenticationClient({
  domain: "dev-lblgf0vk0.eu.auth0.com",
  clientId: "Octa0nqPuc08JFFEZd090jF8GeoU9Eh3",
  clientSecret:
    "Mx_B-6mU8WjqcaJiJSoWLuLjY--2NEjRHI4vOWtHWxdQdVQPIhzgmgX3QUesj-ax",
});

// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

// The /profile route will show the user profile as JSON
app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

const checkPermissions = (authorized) => {
  return (req, res, next) => {
    req.permissions = authorized;
    if (authorized == true) {
      res.send("Access granted");
      // getting user id from auth0 client
      const id = auth0Client.getProfile(req.query.access_token, (err, user) => {
        if (err) return res.send(err);
        console.log(user.user_id);
        res.send(user.user_id);
      });
      const body = { id };

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
    } else {
      res.status(401).send("Access denied");
    }
  };
};
app.use(checkPermissions);

// GET /teams?id/resources API route to list resources of specific team

app.get("/teams/:id/resources", checkPermissions(true), (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  const id = auth0Client.getProfile(req.query.access_token, (err, user) => {
    if (err) return res.send(err);
    console.log(user.user_id);
    res.send(JSON.stringify(user.user_id));
  });
  console.log(id);
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
     "id": ${id},
     "relation": ""
   },
 }`);
});

// GET /teams?id/resources?id API route to view resource

app.get("/resources/:id", checkPermissions(true), (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  const id = auth0Client.getProfile(req.query.access_token, (err, user) => {
    if (err) return res.send(err);
    console.log(user.user_id);
    res.send(JSON.stringify(user.user_id));
  });
  console.log(id);
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
     "id": ${id},
     "relation": ""
   },
   
 }`);
});

// PUT /resources?id API route to edit resource
app.put("/resources/:id", checkPermissions(true), (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  const id = auth0Client.getProfile(req.query.access_token, (err, user) => {
    if (err) return res.send(err);
    console.log(user.user_id);
    res.send(JSON.stringify(user.user_id));
  });
  console.log(id);
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
    "id": ${id},
    "relation": ""
  },
}
`);
});

// DELETE /resources?id API route to delete the resource

app.delete("/resources/:id", checkPermissions(true), (req, res) => {
  // create a middleware for that get receiver
  // that sends a REST API request to:
  // "localhost:3476/v1/permissions/check" endpoint
  // with body params:
  const id = auth0Client.getProfile(req.query.access_token, (err, user) => {
    if (err) return res.send(err);
    console.log(user.user_id);
    res.send(JSON.stringify(user.user_id));
  });
  console.log(id);
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
      "id": ${id},
      "relation": ""
    },
  }`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
