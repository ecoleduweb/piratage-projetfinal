const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3001;
const APP_TOKEN = "secret";
const JWT_SECRET = APP_TOKEN; // plus simple pour la gestion des tokens. Comme ça, on peut valider le token dans toutes nos applications.

app.use(bodyParser.json());

const validateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  if (token !== APP_TOKEN) {
    return res.status(401).json({
      message: `invalid token, you need ${APP_TOKEN} (remove this when on prod server)`,
    });
  }
  next();
};

app.use(validateToken);

const loadSecretDatabase = async () => {
  return JSON.parse(await fs.readFile("database.json"));
};

const findInSecretDatabase = async (user) => {
  const db = await loadSecretDatabase();
  return db.find((x) => x.username === user);
};

app.get("/authenticate", async (req, res) => {
  try {
    const { username, password } = req.query;
    const user = await findInSecretDatabase(username);
    if (user && username === user.username && password === user.password) {
      const token = jwt.sign({ username }, JWT_SECRET, {
        expiresIn: "8760h",
      });
      res.json({ token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/creditCards", async (req, res) => {
  try {
    const db = await loadSecretDatabase();
    res.json(db);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
