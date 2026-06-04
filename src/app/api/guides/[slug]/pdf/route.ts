import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { fetchGuideBySlug } from "@/lib/guides/queries";
import { isPillarSlug } from "@/lib/guides/pillars";

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/>\s\*\*Key Takeaway:\*\*/g, "Takeaway:")
    .replace(/`/g, "")
    .trim();
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!isPillarSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guide = await fetchGuideBySlug(slug);
  if (!guide) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFontSize(16);
  doc.text(guide.title, margin, y, { maxWidth: pageWidth });
  y += 12;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `InfluexAI Guide · ${guide.word_count} Wörter · influexaicreator.com/guides/${slug}`,
    margin,
    y
  );
  y += 10;
  doc.setTextColor(0);

  doc.setFontSize(10);
  const plain = stripMarkdown(guide.content);
  const lines = doc.splitTextToSize(plain, pageWidth);

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }

  const pdf = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
    },
  });
}
