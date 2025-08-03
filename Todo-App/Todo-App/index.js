const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 3000;
const CONNECTION_STRING = process.env.MONGO_DB_CONNECTION_STRING;

//  Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // frontend URL
    credentials: true                // allow cookies/headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//  Routes

const todoRoutes = require("./routes/todo.routes.js");
app.use("/api/todo", todoRoutes);

app.get("/", async (req, res) => {
  res.send("Hello world");
});

mongoose
  .connect(CONNECTION_STRING)
  .then(() => {
    console.log("CONNECTED TO DB");
    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.log("CONNECTION FAILED!" + e);
  });
