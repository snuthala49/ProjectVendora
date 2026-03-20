import { NextRequest, NextResponse } from "next/server";
import { subHours } from "date-fns";
import prisma from "@/lib/prisma";
import type { Severity, OutageStatus } from "@/types";

export const dynamic = "force-dynamic";

const VENDOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoEmoji: true,
  category: true,
  statusPageUrl: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vendorSlug = searchParams.get("vendor");
    const severity = searchParams.get("severity") as Severity | null;
    const status = searchParams.get("status") as OutageStatus | null;
    const hours = Math.min(
      parseInt(searchParams.get("hours") ?? "24", 10),
      168 // max 7 days
    );
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") ?? "50", 10),
      100
    );

    const since = subHours(new Date(), hours);

    // Build where clause
    const where: Record<string, unknown> = {
      startedAt: { gte: since },
    };

    if (vendorSlug) {
      where.vendor = { slug: vendorSlug };
    }
    if (severity && severity !== ("ALL" as string)) {
      where.severity = severity;
    }
    if (status && status !== ("ALL" as string)) {
      where.status = status;
    }

    const [outages, total] = await Promise.all([
      prisma.outage.findMany({
        where,
        include: { vendor: { select: VENDOR_SELECT } },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.outage.count({ where }),
    ]);

    // Serialize Date → ISO string
    const serialised = outages.map((o) => ({
      ...o,
      startedAt: o.startedAt.toISOString(),
      resolvedAt: o.resolvedAt?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return NextResponse.json({ outages: serialised, total, page, pageSize });
  } catch (err) {
    console.error("[GET /api/outages]", err);
    return NextResponse.json(
      { error: "Failed to fetch outages" },
      { status: 500 }
    );
  }
}
