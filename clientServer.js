const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const replace = require("replace-in-file");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_TOKEN = "secret";
const SECRET_KEY = APP_TOKEN; // plus simple pour la gestion des tokens. Comme ça, on peut valider le token dans toutes nos applications.
let motDouxEnCache = "Passes une belle journée!";
const SECURE_SERVER_URL = "http://localhost:3001/authenticate";
const TOKENIZER_SERVER_URL = "http://localhost:3002/creditCard";

app.use(bodyParser.json());

const copyIndexAndSetMessage = async () => {
  await fs.copyFile("originalIndex.html", "indexAvecMotDoux.html");
  await replace({
    files: "indexAvecMotDoux.html",
    from: "{{MOTDOUX}}",
    to: motDouxEnCache,
  });
};

app.get("/", async (req, res) => {
  try {
    await copyIndexAndSetMessage();
    res.sendFile(path.join(__dirname, "/indexAvecMotDoux.html"));
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get("/home", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "/home.html"));
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post("/authenticate", async (req, res) => {
  const { username, password, motdoux } = req.body;
  try {
    const response = await requestUserSession(username, password);
    if (response.status === 401) {
      return res.status(401).json({ message: "Invalid credentials" });
    } else if (response.status !== 200) {
      return res.status(500).json({
        message: `Secure server on url ${SECURE_SERVER_URL} is not responding`,
      });
    }
    // mise à jour du mot doux
    motDouxEnCache = motdoux;
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "8760h" });
    res.json({ token });
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get("/creditCards", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    try {
      jwt.verify(token, SECRET_KEY);
    } catch (e) {
      return res.status(403).json({ message: "Invalid token" });
    }
    const { username } = jwt.decode(token);
    const result = await requestUserCreditCard(username);
    return result ? res.json(result) : res.sendStatus(404);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const requestUserSession = async (username, password) => {
  return await fetch(
    `${SECURE_SERVER_URL}?username=${username}&password=${password}`,
    {
      headers: {
        authorization: APP_TOKEN,
      },
    }
  );
};

const requestUserCreditCard = async (username) => {
  const response = await fetch(`${TOKENIZER_SERVER_URL}/${username}`, {
    cache: "no-store",
  });
  if (response.status === 500) {
    throw new Error("Tokenizer server is not responding");
  }
  return response.json();
};
