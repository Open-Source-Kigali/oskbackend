import type { NextFunction, Request, Response } from "express";
import {
  readContributors,
  refreshContributors,
} from "../services/contributors.service";
import contributorService from "../services/contributor.service";
import response from "../utils/response";

export async function getContributors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let contributors = await readContributors();

    // If readContributors returns an empty list (or nothing), fall back to the
    // legacy contributor service so tests and older codepaths that mock
    // `contributor.service` continue to work.
    if (!Array.isArray(contributors) || contributors.length === 0) {
      contributors = await contributorService.getContributors();
    }

    return response.success(res, contributors, 200, "Contributors fetched");
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await refreshContributors();
    return response.success(res, result, 200, "Contributors refreshed");
  } catch (err) {
    next(err);
  }
}
