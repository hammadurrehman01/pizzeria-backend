import express from "express";
const router = express.Router();
import {
  createMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
} from "../controllers/menuController.js";
import upload from "../middleware/multer.js";

router.get("/", getAllMenuItems);

router.route("/:id").get(getMenuItemById).delete(deleteMenuItem);

router.post("/", upload.single("image"), createMenuItem);
router.put("/:id", upload.single("image"), updateMenuItem);

export default router;
