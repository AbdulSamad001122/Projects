const mongoose = require("mongoose");

const TodoSchema = mongoose.Schema(
  {
    todo: {
      type: String,
      required: [true],
    },

    desc: {
      type: String,
      required: [false, "Please enter a desc"],
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Todo = mongoose.model("Todo", TodoSchema);

module.exports = Todo;
