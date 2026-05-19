import { Request, Response, NextFunction } from "express";
import projectService from "../services/project.service";
import response from "../utils/response";
import { ProjectStatus } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { fetchRepoSnapshot } from "../services/github.service";
import trimStrings from "../utils/trim-strings";
import {
  createProjectSchema,
  updateProjectSchema,
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";

const FOLDER = "open-source-kigali/projects";

type CreateBody = {
  slug: string;
  repoOwner: string;
  repoName: string;
  tagline: string;
  category: string;
  status?: ProjectStatus;
  featured?: string | boolean;
  maintainer?: string;
  langColor?: string;
};

type UpdateBody = Partial<CreateBody>;

async function findAllProjects(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await projectService.findAllProjects();
    response.success(res, projects, 200, "Projects retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function findProjectBySlug(
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const project = await projectService.findProjectBySlug(req.params.slug);
    if (!project) return response.failure(res, "Project not found", 404);
    response.success(res, project, 200, "Project retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addProject(
  req: Request<unknown, unknown, CreateBody>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) return response.failure(res, "Image file is required", 400);

  let publicId: string | undefined;
  try {
    const validation = createProjectSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e: any) => `${e.path.join(".") || "root"}: ${e.message}`)
        .join("; ");
      return response.failure(res, errors, 400);
    }

    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const created = await projectService.addProject({
      slug: validation.data.slug,
      repoOwner: validation.data.repoOwner,
      repoName: validation.data.repoName,
      tagline: validation.data.tagline,
      category: validation.data.category,
      status: validation.data.status,
      featured: validation.data.featured,
      maintainer: validation.data.maintainer ?? null,
      langColor: validation.data.langColor ?? null,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
    });

    let project = created;
    try {
      const snap = await fetchRepoSnapshot(created.repoOwner, created.repoName);
      project = await projectService.applyGithubSnapshot(created.id, snap);
    } catch {
      // best-effort: GitHub data can be filled in later via /refresh
    }

    response.success(res, project, 201, "Project created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updateProject(
  req: Request<{ id: string }, unknown, UpdateBody>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await projectService.findProjectById(req.params.id);
    if (!existing) return response.failure(res, "Project not found", 404);

    const validation = updateProjectSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e: any) => `${e.path.join(".") || "root"}: ${e.message}`)
        .join("; ");
      return response.failure(res, errors, 400);
    }

    const data: Record<string, unknown> = Object.fromEntries(
      Object.entries(validation.data).filter(([, v]) => v !== "" && v !== undefined),
    );

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      data.imageUrl = uploaded.secure_url;
      data.imagePublicId = uploaded.public_id;
    }

    const updated = await projectService.updateProject(req.params.id, data);

    if (req.file && existing.imagePublicId) {
      await destroyImage(existing.imagePublicId);
    }

    response.success(res, updated, 200, "Project updated successfully");
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

async function deleteProject(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await projectService.findProjectById(req.params.id);
    if (!existing) return response.failure(res, "Project not found", 404);

    await projectService.deleteProject(req.params.id);
    if (existing.imagePublicId) await destroyImage(existing.imagePublicId);

    response.success(res, null, 204, "Project deleted successfully");
  } catch (err) {
    next(err);
  }
}

async function refreshAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await projectService.findAllProjectsForRefresh();
    const results = await Promise.allSettled(
      projects.map(async (p) => {
        const snap = await fetchRepoSnapshot(p.repoOwner, p.repoName);
        await projectService.applyGithubSnapshot(p.id, snap);
        return p;
      }),
    );

    const summary = results.map((r, i) => {
      const p = projects[i];
      if (r.status === "fulfilled") {
        return { id: p.id, slug: p.slug, ok: true };
      }
      return {
        id: p.id,
        slug: p.slug,
        ok: false,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    });

    response.success(res, summary, 200, "Refresh completed");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllProjects,
  findProjectBySlug,
  addProject,
  updateProject,
  deleteProject,
  refreshAll,
};
