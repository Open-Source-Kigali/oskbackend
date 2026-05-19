import { Router } from "express";
import reviewController from "../controllers/review.controller";
import authMiddleware from "../middlewares/auth.middleware";

const route = Router();

route.get("/", reviewController.findAllReviews);
route.get("/:id", reviewController.findReviewById);
route.post("/", reviewController.createReview);

route.use(authMiddleware.requireAdmin);
route.put("/:id", reviewController.updateReview);
route.delete("/:id", reviewController.deleteReview);

export default route;
