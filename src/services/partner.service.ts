import { prisma } from "../config/prisma";
import { Partner, Prisma } from "../generated/prisma/client";

// Public partner payloads only expose the URL clients render, not the storage key.
const publicPartnerSelect = {
  id: true,
  name: true,
  websiteUrl: true,
  logoUrl: true,
  description: true,
  email: true,
  partershipReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartnerSelect;

async function findAllPartners() { fix/hide-public-image-identifiers
  return prisma.partner.findMany({ select: publicPartnerSelect });
}

async function findPublicPartnerById(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    select: publicPartnerSelect,
  });
  return prisma.partner.findMany({ orderBy: { name: "asc" } });
dev
}

async function addPartner(
  partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.partner.create({
    data: partnerData,
    select: publicPartnerSelect,
  });
}

async function findPartnerById(id: string) {
  return prisma.partner.findUnique({ where: { id } });
}

async function updatePartner(
  id: string,
  partnerData: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
) {
  return prisma.partner.update({
    where: { id },
    data: partnerData,
    select: publicPartnerSelect,
  });
}

async function deletePartner(id: string) {
  return prisma.partner.delete({ where: { id } });
}

export default {
  findAllPartners,
  findPublicPartnerById,
  addPartner,
  findPartnerById,
  updatePartner,
  deletePartner,
};
