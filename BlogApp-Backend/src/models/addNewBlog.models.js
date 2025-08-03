import { mongoose, Schema } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    blogCover: {
      type: String,
      // required : true
    },
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", blogSchema);
