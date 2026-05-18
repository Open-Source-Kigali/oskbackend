import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { CodingLevel, Member } from "../generated/prisma/client";
import trimStrings from "../utils/trim-strings";
import {
  createMemberSchema,
  updateMemberSchema,
  CreateMemberInput,
  UpdateMemberInput,
} from "../schemas/member.schema";

const allowedCodingLevels = new Set(Object.values(CodingLevel));

async function findAllMembers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const members = await memberService.findAllMembers();
    response.success(res, members, 200, "Members retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function findMemberById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const member = await memberService.findMemberById(req.params.id);
    if (!member) {
      return response.failure(res, "Member not found", 404);
    }
    response.success(res, member, 200, "Member retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addMember(
  req: Request<object, unknown, Omit<Member, "id">>,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = createMemberSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e: any) => `${e.path.join(".") || "root"}: ${e.message}`)
        .join("; ");
      return response.failure(res, errors, 400);
    }

    const newMember = await memberService.addMember(validation.data);
    response.success(res, newMember, 201, "Member created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateMember(
  req: Request<{ id: string }, unknown, Partial<Omit<Member, "id">>>,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = updateMemberSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e: any) => `${e.path.join(".") || "root"}: ${e.message}`)
        .join("; ");
      return response.failure(res, errors, 400);
    }

    const filtered = Object.fromEntries(
      Object.entries(validation.data).filter(([, v]) => v !== "" && v !== undefined),
    ) as UpdateMemberInput;

    if (
      filtered.codingLevel !== undefined &&
      !allowedCodingLevels.has(filtered.codingLevel)
    ) {
      return response.failure(
        res,
        "Invalid codingLevel. Allowed values: beginner, intermediate, advanced",
        400,
      );
    }

    const updatedMember = await memberService.updateMember(
      req.params.id,
      filtered,
    );
    response.success(res, updatedMember, 200, "Member updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteMember(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await memberService.findMemberById(req.params.id);
    if (!existing) return response.failure(res, "Member not found", 404);

    await memberService.deleteMember(req.params.id);
    response.success(res, null, 204, "Member deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllMembers,
  findMemberById,
  addMember,
  updateMember,
  deleteMember,
};