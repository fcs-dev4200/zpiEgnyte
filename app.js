import express from "express";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import session from "express-session";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import ngrok from "@ngrok/ngrok";
import searchRouter from "./routes/searchRouter.js";

const dirname = fileURLToPath(new URL(".", import.meta.url));
const filePath = join(dirname, "views");
const assetsPath = join(dirname, "public");
const utilPath = join(dirname, "utils");
const dbPath = join(dirname, "db");
const app = express();

app.use(express.json());
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));
app.set("views", filePath);
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: "/",
      httpOnly: true,
      secure: false,
      maxAge: null,
    },
    name: "loginCookie",
  }),
);

app.use(cookieParser());

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/log-in", async (req, res) => {
  const { username } = req.body;
  const loginUser = process.env.LOGIN_UN;
  const loginPw = await bcrypt.hash(process.env.LOGIN_PW, 10);
  const match = await bcrypt.compare(req.body.password, loginPw);
  const userObj = { username };
  if (match && username === loginUser) {
    req.session.user = userObj;
    const sesh = req.session;
    const cookie = sesh.cookie;
    // console.log("session", sesh);
    // console.log("cookie", cookie);
    // console.log("username?", cookie.user);
    res.redirect("/");
  } else {
    res.render("login-error");
  }
});

app.get("/login-error", (req, res) => res.render("login-error"));

app.get("/cookie-test", (req, res) => {
  const cookie = req.cookies || {};
  const sessionData = req.session || {};
  // console.log("sesh", sessionData);
  const { username } = cookie;
  // console.log(cookie);

  if (req.session.user.username) {
    res.send({ success: true, message: "User is correct" });
  } else {
    res.send({ success: false, message: "user is not correct" });
  }
});

app.get("/", (req, res) => {
  const sessionData = req.session || {};
  if (sessionData.user) {
    // console.log("authenticated");
    res.render("display");
  } else {
    // console.log("sign in");
    res.redirect("/login");
  }
});
app.use("/search", searchRouter);

function getAuth(req, res, next) {
  // console.log("user", res.locals.user);
  if (res.locals.user === "Admin") {
    res.locals.isAuthenticated = true;
  }
  return next();
}

app.use(getAuth);

const port = 8000;
app.listen(process.env.PORT || port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`ZPI Search running on port: ${port}`);
});

process.stdin.resume();

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  logger.fatal(err, "UNCAUGHT EXCEPTION!");
  server.close(() => {
    process.exit(1);
  });
});

// This should be left disable during production. Only enable this if you are doing local development

(async function () {
  const listener = await ngrok.forward({
    addr: port,
    authtoken: process.env.NGROK_AUTHTOKEN,
    domain: process.env.NGROK_DOMAIN,
  });
  console.log("Ingress established at", listener.url());
})();
