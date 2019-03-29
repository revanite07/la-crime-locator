var express = require("express");
var path = require("path");
var logger = require("morgan");
// Sets up the Express App
// =============================================================
var app = express();
var PORT = 3000;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger("dev"));
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "./public/index.html"));
  });

  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
  