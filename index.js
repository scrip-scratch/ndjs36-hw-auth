const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("./db/index");

const verify = (username, password, done) => {
  db.findByUsername(username, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false);
    }
    if (!db.verifyPassword(user, password)) {
      return done(null, false);
    }
    return done(null, user);
  });
};

const options = {
  usernameField: "username",
  passwordField: "password",
};

passport.use("local", new LocalStrategy(options, verify));

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  db.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

const app = express();
app.set("view engine", "ejs");

app.use(express.urlencoded());
app.use(session({ secret: "SESSION-SECRET-KEY" }));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/api/user/login", (req, res) => {
  res.render("login");
});

app.get("/api/user/reg", (req, res) => {
  res.render("reg");
});

app.post(
  "/api/user/login",
  passport.authenticate("local", { failureRedirect: "/api/user/login" }),
  (req, res) => {
    console.log("req.user: ", req.user);
    res.redirect("/");
  }
);

app.post("/api/user/signup", (req, res) => {
  db.addUser(req.body);
  res.redirect("/");
});

app.get("/api/user/logout", (req, res) => {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

app.get(
  "/api/user/me",
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/api/user/login");
    }
    next();
  },
  (req, res) => {
    res.render("profile", { user: req.user });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
