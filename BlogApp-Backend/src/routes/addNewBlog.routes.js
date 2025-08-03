import { Router } from "express";
import { addNewBlog } from "../controllers/addNewBlog.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/newblog").post(
  upload.fields([
    {
      name: "blogCover",
      maxCount: 1,
    },
  ]),
  addNewBlog
);

// export default router;

export default router;
