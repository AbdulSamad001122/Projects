const express = require("express");
const {
  addtodo,
  getalltodos,
  gettodobyid,
  updatetodo,
  deletetodo,
} = require("../controllers/todo.controllers.js");

const router = express.Router();

// Add a Todo
router.post("/addtodos", addtodo);

// Get all Todos
router.get("/getalltodos", getalltodos);

// Get a Todo by Id
router.get("/gettodobyid/:id", gettodobyid);

// Update a Todo
router.put("/updatetodo/:id", updatetodo);

// Delete a Todo
router.delete("/deletetodo/:id", deletetodo);

module.exports = router;
