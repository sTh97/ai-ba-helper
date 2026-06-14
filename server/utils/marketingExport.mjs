import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import PptxGenJS from "pptxgenjs";

const DEFAULT_PRIMARY = "1d4ed8";
const DEFAULT_ACCENT = "7c3aed";

export const FORMAT_META = {
  pdf: { ext: "pdf", mime: "application/pdf", label: "PDF" },
  docx: {
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word",
  },
  pptx: {
    ext: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint",
  },
};

const hex = (value, fallback) => {
  const clean = String(value || "").replace(/[^0-9a-fA-F]/g, "");
  return clean.length === 6 ? clean.toLowerCase() : fallback;
};

const safe = (value) => String(value ?? "").trim();

const slugify = (value) =>
  safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "marketing-collateral";

const normalizeContent = (content = {}) => ({
  title: safe(content.title) || "Marketing Collateral",
  subtitle: safe(content.subtitle),
  summary: safe(content.summary),
  sections: Array.isArray(content.sections)
    ? content.sections
        .map((s) => ({
          heading: safe(s.heading),
          subheading: safe(s.subheading),
          body: safe(s.body),
          bullets: Array.isArray(s.bullets) ? s.bullets.map(safe).filter(Boolean) : [],
        }))
        .filter((s) => s.heading || s.body || s.bullets.length)
    : [],
  callToAction: safe(content.callToAction),
  contact: safe(content.contact),
  theme: {
    primary: hex(content.theme?.primary, DEFAULT_PRIMARY),
    accent: hex(content.theme?.accent, DEFAULT_ACCENT),
  },
});

export const buildExportFilename = (name, format) => {
  const meta = FORMAT_META[format] || FORMAT_META.pdf;
  return `${slugify(name)}.${meta.ext}`;
};

// ---------- PDF ----------
const buildPdfBuffer = (content) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 56 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const primary = `#${content.theme.primary}`;
      const accent = `#${content.theme.accent}`;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.rect(0, 0, doc.page.width, 130).fill(primary);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26)
        .text(content.title, doc.page.margins.left, 40, { width: pageWidth });
      if (content.subtitle) {
        doc.font("Helvetica").fontSize(13)
          .text(content.subtitle, doc.page.margins.left, 78, { width: pageWidth });
      }

      doc.moveDown(2);
      doc.y = 160;
      doc.fillColor("#111827");

      if (content.summary) {
        doc.font("Helvetica").fontSize(12).fillColor("#374151")
          .text(content.summary, { width: pageWidth, lineGap: 3 });
        doc.moveDown(1);
      }

      content.sections.forEach((section) => {
        if (doc.y > doc.page.height - 140) doc.addPage();

        if (section.heading) {
          doc.font("Helvetica-Bold").fontSize(16).fillColor(primary)
            .text(section.heading, { width: pageWidth });
          doc.moveDown(0.2);
        }
        if (section.subheading) {
          doc.font("Helvetica-Oblique").fontSize(11).fillColor(accent)
            .text(section.subheading, { width: pageWidth });
          doc.moveDown(0.3);
        }
        if (section.body) {
          doc.font("Helvetica").fontSize(11).fillColor("#374151")
            .text(section.body, { width: pageWidth, lineGap: 2 });
          doc.moveDown(0.3);
        }
        section.bullets.forEach((bullet) => {
          doc.font("Helvetica").fontSize(11).fillColor("#374151")
            .text(`•  ${bullet}`, { width: pageWidth, indent: 8, lineGap: 2 });
        });
        doc.moveDown(0.9);
      });

      if (content.callToAction) {
        if (doc.y > doc.page.height - 130) doc.addPage();
        const boxY = doc.y + 6;
        const boxHeight = 56;
        doc.roundedRect(doc.page.margins.left, boxY, pageWidth, boxHeight, 8).fill(accent);
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13)
          .text(content.callToAction, doc.page.margins.left + 16, boxY + 18, {
            width: pageWidth - 32,
          });
        doc.y = boxY + boxHeight + 12;
      }

      if (content.contact) {
        doc.fillColor("#6b7280").font("Helvetica").fontSize(10)
          .text(content.contact, doc.page.margins.left, doc.y, { width: pageWidth });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

// ---------- DOCX ----------
const buildDocxBuffer = async (content) => {
  const primary = content.theme.primary;
  const accent = content.theme.accent;
  const children = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.title, bold: true, size: 48, color: primary })],
      spacing: { after: 120 },
    })
  );
  if (content.subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.subtitle, size: 26, color: accent })],
        spacing: { after: 200 },
      })
    );
  }
  if (content.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.summary, size: 24 })],
        spacing: { after: 240 },
      })
    );
  }

  content.sections.forEach((section) => {
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: section.heading, bold: true, color: primary })],
          spacing: { before: 200, after: 80 },
        })
      );
    }
    if (section.subheading) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.subheading, italics: true, color: accent, size: 24 })],
          spacing: { after: 80 },
        })
      );
    }
    if (section.body) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.body, size: 24 })],
          spacing: { after: 80 },
        })
      );
    }
    section.bullets.forEach((bullet) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: bullet, size: 24 })],
        })
      );
    });
  });

  if (content.callToAction) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 320, after: 120 },
        children: [new TextRun({ text: content.callToAction, bold: true, size: 26, color: accent })],
      })
    );
  }
  if (content.contact) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.contact, size: 20, color: "6b7280" })],
        spacing: { before: 120 },
      })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
};

// ---------- PPTX ----------
const buildPptxBuffer = async (content) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const primary = content.theme.primary;
  const accent = content.theme.accent;

  const title = pptx.addSlide();
  title.background = { color: primary };
  title.addText(content.title, {
    x: 0.6, y: 2.2, w: 12, h: 1.4, fontSize: 40, bold: true, color: "FFFFFF",
  });
  if (content.subtitle) {
    title.addText(content.subtitle, {
      x: 0.6, y: 3.6, w: 12, h: 0.8, fontSize: 20, color: "FFFFFF",
    });
  }

  if (content.summary) {
    const overview = pptx.addSlide();
    overview.addText("Overview", { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 28, bold: true, color: primary });
    overview.addText(content.summary, { x: 0.6, y: 1.4, w: 12, h: 5, fontSize: 18, color: "333333" });
  }

  content.sections.forEach((section) => {
    const slide = pptx.addSlide();
    slide.addText(section.heading || "Section", {
      x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 28, bold: true, color: primary,
    });
    let cursorY = 1.3;
    if (section.subheading) {
      slide.addText(section.subheading, {
        x: 0.6, y: cursorY, w: 12, h: 0.6, fontSize: 18, italic: true, color: accent,
      });
      cursorY += 0.7;
    }
    if (section.body) {
      slide.addText(section.body, {
        x: 0.6, y: cursorY, w: 12, h: 1.4, fontSize: 16, color: "333333",
      });
      cursorY += 1.5;
    }
    if (section.bullets.length) {
      slide.addText(
        section.bullets.map((text) => ({ text, options: { bullet: true } })),
        { x: 0.6, y: cursorY, w: 12, h: 5 - cursorY, fontSize: 16, color: "333333" }
      );
    }
  });

  if (content.callToAction) {
    const cta = pptx.addSlide();
    cta.background = { color: accent };
    cta.addText(content.callToAction, {
      x: 0.6, y: 2.8, w: 12, h: 1.6, fontSize: 30, bold: true, color: "FFFFFF", align: "center",
    });
    if (content.contact) {
      cta.addText(content.contact, {
        x: 0.6, y: 4.6, w: 12, h: 0.8, fontSize: 16, color: "FFFFFF", align: "center",
      });
    }
  }

  const data = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
};

export const generateCollateralFile = async (rawContent, format) => {
  const content = normalizeContent(rawContent);
  if (format === "docx") return buildDocxBuffer(content);
  if (format === "pptx") return buildPptxBuffer(content);
  return buildPdfBuffer(content);
};

const escapeHtml = (value) =>
  safe(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// HTML preview rendered in the client iframe — mirrors the document structure.
export const buildCollateralPreviewHtml = (rawContent) => {
  const content = normalizeContent(rawContent);
  const primary = `#${content.theme.primary}`;
  const accent = `#${content.theme.accent}`;

  const sectionsHtml = content.sections
    .map((section) => {
      const bullets = section.bullets.length
        ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      return `<section class="block">
        ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
        ${section.subheading ? `<h3>${escapeHtml(section.subheading)}</h3>` : ""}
        ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ""}
        ${bullets}
      </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(content.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; background: #f3f4f6; }
  .page { max-width: 820px; margin: 24px auto; background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border-radius: 12px; overflow: hidden; }
  .hero { background: ${primary}; color: #fff; padding: 40px 44px; }
  .hero h1 { margin: 0 0 8px; font-size: 30px; line-height: 1.2; }
  .hero p { margin: 0; font-size: 16px; opacity: 0.92; }
  .body { padding: 32px 44px 40px; }
  .summary { font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px; }
  .block { margin-bottom: 26px; }
  .block h2 { color: ${primary}; font-size: 20px; margin: 0 0 6px; }
  .block h3 { color: ${accent}; font-size: 14px; font-weight: 600; font-style: italic; margin: 0 0 8px; }
  .block p { font-size: 14.5px; line-height: 1.6; color: #374151; margin: 0 0 8px; }
  .block ul { margin: 8px 0 0; padding-left: 22px; }
  .block li { font-size: 14.5px; line-height: 1.6; color: #374151; margin-bottom: 4px; }
  .cta { background: ${accent}; color: #fff; padding: 22px 28px; border-radius: 10px; font-size: 17px; font-weight: 700; text-align: center; margin-top: 18px; }
  .contact { margin-top: 18px; color: #6b7280; font-size: 13px; }
</style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <h1>${escapeHtml(content.title)}</h1>
      ${content.subtitle ? `<p>${escapeHtml(content.subtitle)}</p>` : ""}
    </div>
    <div class="body">
      ${content.summary ? `<p class="summary">${escapeHtml(content.summary)}</p>` : ""}
      ${sectionsHtml}
      ${content.callToAction ? `<div class="cta">${escapeHtml(content.callToAction)}</div>` : ""}
      ${content.contact ? `<div class="contact">${escapeHtml(content.contact)}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
};

export { normalizeContent };
