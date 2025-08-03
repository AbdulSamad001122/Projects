import { Blog } from "../models/addNewBlog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { fileDeletorFromTempFolder } from "../utils/fileDeletorfromTempfolder.js";

const addNewBlog = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  console.log(req.body);

  if (!title || !content) {
    throw new ApiError(400, "Please enter title and content");
  }

  try {
    // Handle file upload if present
    let blogCoverUrl = null;
    if (req.files && req.files.blogCover && req.files.blogCover[0]) {
      const blogCoverLocalPath = req.files.blogCover[0].path;
      console.log("File path:", blogCoverLocalPath);

      try {
        const uploadResult = await uploadOnCloudinary(blogCoverLocalPath);
        if (uploadResult) {
          blogCoverUrl = uploadResult.url;
          console.log("Uploaded blogCover", blogCoverUrl);

          // Delete the file from temp folder after uploading to cloudinary
          await fileDeletorFromTempFolder(blogCoverLocalPath);
        } else {
          console.log("Upload failed or returned null");
        }
      } catch (error) {
        console.log("Cloudinary upload error:", error);
        throw new ApiError(500, "Error while uploading on cloudinary");
      }
    } else {
      console.log("No file uploaded, proceeding without cover image");
    }

    const newBlog = await Blog.create({
      title,
      content,
      blogCover: blogCoverUrl,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newBlog, "Your blog is created successfully"));
  } catch (error) {
    console.log("Controller error:", error);
    throw new ApiError(
      500,
      "Error happened in creating blog document in database"
    );
  }
});

// Delete file from temp folder

export { addNewBlog };
