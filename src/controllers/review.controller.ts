import { NextFunction, Request, Response } from "express";
import reviewService from "../services/review.service";
import response from "../utils/response";
import { Review } from "../generated/prisma/client";

async function findAllReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.findAllReviews();
    response.success(res, reviews, 200, "Reviews fetched successfully");
  } catch (err) {
    next(err);
  }
}

async function findReviewById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const review = await reviewService.findReviewById(req.params.id);
    if (!review) {
      return response.failure(res, "Review not found", 404);
    }
    response.success(res, review, 200, "Review retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function createReview(
  req: Request<object, unknown, Omit<Review, "id">>,
  res: Response,
  next: NextFunction,
) {
  try {
    const newReview = await reviewService.createReview(req.body);
    response.success(res, newReview, 201, "Review created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateReview(
  req: Request<{ id: string }, unknown, Partial<Omit<Review, "id">>>,
  res: Response,
  next: NextFunction,
) {
  try {
    const filtered = Object.fromEntries(
      Object.entries(req.body).filter(([, v]) => v !== ""),
    ) as Partial<Omit<Review, "id">>;
    const updatedReview = await reviewService.updateReview(
      req.params.id,
      filtered,
    );
    response.success(res, updatedReview, 200, "Review updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteReview(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    await reviewService.deleteReview(req.params.id);
    response.success(res, null, 204, "Review deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllReviews,
  findReviewById,
  createReview,
  updateReview,
  deleteReview,
};
