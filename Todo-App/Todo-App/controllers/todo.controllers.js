const Todo = require("../models/todo.models.js");

// Add a Todo

const addtodo = async (req, res) => {
  try {
    const todo = await Todo.create(req.body);
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Todos

const getalltodos = async (req, res) => {
  try {
    const todos = await Todo.find({});
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a Todo by Id

const gettodobyid = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Todo

const updatetodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndUpdate(id, req.body);

    if (!todo) {
      res.status(404).json({ message: "Todo not found" });
    }

    const updatedTodo = await Todo.findById(id);
    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Todo

const deletetodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      res
        .status(404)
        .json({ message: "Todo not found. So it cannot be deleted" });
    }

    res.status(200).json({ message: "Todo Deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addtodo,
  getalltodos,
  gettodobyid,
  updatetodo,
  deletetodo,
};
