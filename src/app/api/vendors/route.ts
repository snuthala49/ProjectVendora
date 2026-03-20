import { NextResponse } from "next/server";
import { subHours } from "date-fns";
import prisma from "@/lib/prisma";
import type { VendorStatus } from "@/types";

export const dynamic = "force-dynamic";

function computeVendorStatus(
  outages: Array<{ severity: string }>
): VendorStatus {
  if (outages.length === 0) return "operational";
  if (outages.some((o) => o.severity === "CRITICAL" || o.severity === "HIGH"))
    return "outage";
  return "degraded";
}

export async function GET() {
  try {
    const since24h = subHours(new Date(), 24);

    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      include: {
        outages: {
          where: {
            startedAt: { gte: since24h },
            status: { not: "RESOLVED" },
          },
          select: { severity: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const vendorsWithStatus = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      feedUrl: v.feedUrl,
      feedType: v.feedType,
      statusPageUrl: v.statusPageUrl,
      logoEmoji: v.logoEmoji,
      category: v.category,
      isActive: v.isActive,
      currentStatus: computeVendorStatus(v.outages),
      activeOutageCount: v.outages.length,
      lastChecked: v.updatedAt.toISOString(),
    }));

    const summary = {
      total: vendorsWithStatus.length,
      operational: vendorsWithStatus.filter(
        (v) => v.currentStatus === "operational"
      ).length,
      degraded: vendorsWithStatus.filter((v) => v.currentStatus === "degraded")
        .length,
      outage: vendorsWithStatus.filter((v) => v.currentStatus === "outage")
        .length,
      unknown: vendorsWithStatus.filter((v) => v.currentStatus === "unknown")
        .length,
    };

    return NextResponse.json({ vendors: vendorsWithStatus, summary });
  } catch (err) {
    console.error("[GET /api/vendors]", err);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
