const express = require("express");
const bodyParser = require("body-parser");
const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console(),
  ],
});

const app = express();
const SECURE_SERVER_URL = "http://localhost:3001";
const PORT = process.env.PORT || 3002;
const APP_TOKEN = "secret";

app.use(bodyParser.json());

const obfuscateCreditCart = (userInfo) => {
  const { number, exp, cvv, password } = userInfo;
  return {
    number: obfuscate(number),
    exp: obfuscate(exp),
    cvv: obfuscate(cvv),
    password: obfuscate(password),
  };
};

// Change un tiers des caractères en *
const obfuscate = (str) => {
  const length = str.length;
  const numStars = Math.ceil(length / 5);
  const stars = "*".repeat(numStars);
  return stars + str.substring(numStars);
};

app.get("/creditCard/:user", async (req, res) => {
  winston.log("info", `Obfuscating credit card for user ${req.params.user}`);
  try {
    const { user } = req.params;
    const creditCards = await requestCreditCards();
    const userInfo = creditCards.find((x) => x.username === user);
    if (userInfo) {
      const obfuscatedCreditCard = obfuscateCreditCart(userInfo);

      logger.info(
        `Obfuscated credit card for user and his private informations, do not share ${user}: ${JSON.stringify(userInfo)}`
      );
      res.json(obfuscatedCreditCard);
    } else {
      res.sendStatus(404);
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const requestCreditCards = async () => {
  const response = await fetch(`${SECURE_SERVER_URL}/creditCards`, {
    headers: {
      authorization: APP_TOKEN,
    },
  });
  return response.json();
};
