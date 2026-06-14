import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

const DEFAULT_PRIMARY = "1d4ed8";

export const FORMAT_META = {
  pdf: { ext: "pdf", mime: "application/pdf", label: "PDF" },
  docx: {
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word",
  },
};

const safe = (value) => String(value ?? "").trim();

const slugify = (value) =>
  safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "solution-architecture";

const normalizeContent = (content = {}) => ({
  title: safe(content.title) || "Solution Architecture",
  summary: safe(content.summary),
  techStack: Array.isArray(content.techStack)
    ? content.techStack
        .map((t) => ({
          layer: safe(t.layer) || "Layer",
          technology: safe(t.technology),
          rationale: safe(t.rationale),
          alternatives: safe(t.alternatives),
        }))
        .filter((t) => t.technology || t.rationale)
    : [],
  technicalViability: {
    assessment: safe(content.technicalViability?.assessment),
    rating: safe(content.technicalViability?.rating),
    scalability: safe(content.technicalViability?.scalability),
    security: safe(content.technicalViability?.security),
    risks: Array.isArray(content.technicalViability?.risks)
      ? content.technicalViability.risks.map(safe).filter(Boolean)
      : [],
    mitigations: Array.isArray(content.technicalViability?.mitigations)
      ? content.technicalViability.mitigations.map(safe).filter(Boolean)
      : [],
  },
  featureLinkages: Array.isArray(content.featureLinkages)
    ? content.featureLinkages
        .map((f) => ({
          feature: safe(f.feature),
          components: Array.isArray(f.components) ? f.components.map(safe).filter(Boolean) : [],
          dependsOn: Array.isArray(f.dependsOn) ? f.dependsOn.map(safe).filter(Boolean) : [],
          description: safe(f.description),
        }))
        .filter((f) => f.feature || f.description)
    : [],
  schemas: Array.isArray(content.schemas)
    ? content.schemas
        .map((s) => ({
          name: safe(s.name),
          description: safe(s.description),
          fields: Array.isArray(s.fields)
            ? s.fields
                .map((fl) => ({
                  name: safe(fl.name),
                  type: safe(fl.type),
                  description: safe(fl.description),
                }))
                .filter((fl) => fl.name)
            : [],
        }))
        .filter((s) => s.name)
    : [],
  erd: {
    entities: Array.isArray(content.erd?.entities)
      ? content.erd.entities
          .map((e) => ({
            name: safe(e.name),
            attributes: Array.isArray(e.attributes) ? e.attributes.map(safe).filter(Boolean) : [],
          }))
          .filter((e) => e.name)
      : [],
    relationships: Array.isArray(content.erd?.relationships)
      ? content.erd.relationships
          .map((r) => ({
            from: safe(r.from),
            to: safe(r.to),
            cardinality: safe(r.cardinality),
            label: safe(r.label),
          }))
          .filter((r) => r.from && r.to)
      : [],
    mermaid: safe(content.erd?.mermaid),
  },
  workflow: {
    description: safe(content.workflow?.description),
    steps: Array.isArray(content.workflow?.steps)
      ? content.workflow.steps
          .map((st, i) => ({
            step: st.step ?? i + 1,
            actor: safe(st.actor),
            action: safe(st.action),
            outcome: safe(st.outcome),
          }))
          .filter((st) => st.action)
      : [],
    mermaid: safe(content.workflow?.mermaid),
  },
});

export const buildExportFilename = (name, format) => {
  const meta = FORMAT_META[format] || FORMAT_META.pdf;
  return `${slugify(name)}.${meta.ext}`;
};

const ensureSpace = (doc, needed = 80) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) doc.addPage();
};

const writeSectionHeading = (doc, text, pageWidth, primary) => {
  ensureSpace(doc, 60);
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(primary).text(text, { width: pageWidth });
  doc.moveDown(0.35);
};

const writeParagraph = (doc, text, pageWidth) => {
  if (!text) return;
  ensureSpace(doc);
  doc.font("Helvetica").fontSize(11).fillColor("#374151").text(text, { width: pageWidth, lineGap: 2 });
  doc.moveDown(0.35);
};

const writeBullets = (doc, items, pageWidth) => {
  (items || []).forEach((item) => {
    ensureSpace(doc);
    doc.font("Helvetica").fontSize(11).fillColor("#374151")
      .text(`•  ${item}`, { width: pageWidth, indent: 8, lineGap: 2 });
  });
  if (items?.length) doc.moveDown(0.25);
};

const writeCodeBlock = (doc, label, code, pageWidth) => {
  if (!code) return;
  ensureSpace(doc, 100);
  if (label) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#6b7280").text(label, { width: pageWidth });
    doc.moveDown(0.15);
  }
  doc.font("Courier").fontSize(9).fillColor("#1f2937")
    .text(code.replace(/\\n/g, "\n"), { width: pageWidth, lineGap: 1 });
  doc.moveDown(0.4);
};

const buildPdfBuffer = (content) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 56 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const primary = `#${DEFAULT_PRIMARY}`;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.rect(0, 0, doc.page.width, 120).fill(primary);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24)
        .text(content.title, doc.page.margins.left, 42, { width: pageWidth });

      doc.y = 150;
      doc.fillColor("#111827");

      if (content.summary) {
        writeSectionHeading(doc, "Executive Summary", pageWidth, primary);
        writeParagraph(doc, content.summary, pageWidth);
      }

      if (content.techStack.length) {
        writeSectionHeading(doc, "Technology Stack", pageWidth, primary);
        content.techStack.forEach((t) => {
          ensureSpace(doc, 70);
          doc.font("Helvetica-Bold").fontSize(12).fillColor(primary)
            .text(`${t.layer}: ${t.technology}`, { width: pageWidth });
          if (t.rationale) writeParagraph(doc, t.rationale, pageWidth);
          if (t.alternatives) {
            doc.font("Helvetica-Oblique").fontSize(10).fillColor("#6b7280")
              .text(`Alternatives: ${t.alternatives}`, { width: pageWidth });
            doc.moveDown(0.25);
          }
        });
      }

      const tv = content.technicalViability;
      if (tv.assessment || tv.rating || tv.scalability || tv.security || tv.risks.length || tv.mitigations.length) {
        writeSectionHeading(doc, "Technical Viability", pageWidth, primary);
        if (tv.rating) writeParagraph(doc, `Feasibility: ${tv.rating}`, pageWidth);
        writeParagraph(doc, tv.assessment, pageWidth);
        if (tv.scalability) writeParagraph(doc, `Scalability: ${tv.scalability}`, pageWidth);
        if (tv.security) writeParagraph(doc, `Security: ${tv.security}`, pageWidth);
        if (tv.risks.length) {
          doc.font("Helvetica-Bold").fontSize(11).fillColor("#b91c1c").text("Risks", { width: pageWidth });
          doc.moveDown(0.15);
          writeBullets(doc, tv.risks, pageWidth);
        }
        if (tv.mitigations.length) {
          doc.font("Helvetica-Bold").fontSize(11).fillColor("#15803d").text("Mitigations", { width: pageWidth });
          doc.moveDown(0.15);
          writeBullets(doc, tv.mitigations, pageWidth);
        }
      }

      if (content.featureLinkages.length) {
        writeSectionHeading(doc, "Feature Linkage", pageWidth, primary);
        content.featureLinkages.forEach((f) => {
          ensureSpace(doc, 60);
          doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(f.feature || "Feature", { width: pageWidth });
          writeParagraph(doc, f.description, pageWidth);
          if (f.components.length) writeParagraph(doc, `Components: ${f.components.join(", ")}`, pageWidth);
          if (f.dependsOn.length) writeParagraph(doc, `Depends on: ${f.dependsOn.join(", ")}`, pageWidth);
        });
      }

      if (content.schemas.length) {
        writeSectionHeading(doc, "Data Schemas", pageWidth, primary);
        content.schemas.forEach((sch) => {
          ensureSpace(doc, 80);
          doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(sch.name, { width: pageWidth });
          writeParagraph(doc, sch.description, pageWidth);
          sch.fields.forEach((fl) => {
            ensureSpace(doc);
            doc.font("Helvetica").fontSize(10).fillColor("#374151")
              .text(`  ${fl.name} (${fl.type || "—"})${fl.description ? ` — ${fl.description}` : ""}`, { width: pageWidth });
          });
          doc.moveDown(0.3);
        });
      }

      if (content.erd.mermaid || content.erd.entities.length || content.erd.relationships.length) {
        writeSectionHeading(doc, "Entity Relationship Diagram (ERD)", pageWidth, primary);
        writeCodeBlock(doc, "Mermaid ERD", content.erd.mermaid, pageWidth);
        content.erd.relationships.forEach((r) => {
          ensureSpace(doc);
          const label = r.label ? ` · ${r.label}` : "";
          doc.font("Helvetica").fontSize(10).fillColor("#374151")
            .text(`${r.from} ${r.cardinality || "—"} ${r.to}${label}`, { width: pageWidth });
        });
      }

      if (content.workflow.description || content.workflow.steps.length || content.workflow.mermaid) {
        writeSectionHeading(doc, "Project Workflow", pageWidth, primary);
        writeParagraph(doc, content.workflow.description, pageWidth);
        writeCodeBlock(doc, "Mermaid flowchart", content.workflow.mermaid, pageWidth);
        content.workflow.steps.forEach((st) => {
          ensureSpace(doc);
          const actor = st.actor ? `${st.actor}: ` : "";
          const outcome = st.outcome ? ` → ${st.outcome}` : "";
          doc.font("Helvetica").fontSize(10).fillColor("#374151")
            .text(`${st.step}. ${actor}${st.action}${outcome}`, { width: pageWidth, indent: 8 });
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

const docxHeading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: true, color: DEFAULT_PRIMARY })],
    spacing: { before: 240, after: 120 },
  });

const docxParagraph = (text, opts = {}) =>
  text
    ? new Paragraph({
        children: [new TextRun({ text, size: 22, ...opts })],
        spacing: { after: 100 },
      })
    : null;

const docxBullets = (items) =>
  (items || []).map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: item, size: 22 })],
      })
  );

const buildDocxBuffer = async (content) => {
  const children = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.title, bold: true, size: 48, color: DEFAULT_PRIMARY })],
      spacing: { after: 200 },
    })
  );

  if (content.summary) {
    children.push(docxHeading("Executive Summary"));
    children.push(docxParagraph(content.summary));
  }

  if (content.techStack.length) {
    children.push(docxHeading("Technology Stack"));
    content.techStack.forEach((t) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t.layer}: `, bold: true, size: 24, color: DEFAULT_PRIMARY }),
            new TextRun({ text: t.technology, bold: true, size: 24 }),
          ],
          spacing: { after: 60 },
        })
      );
      const rationale = docxParagraph(t.rationale);
      if (rationale) children.push(rationale);
      if (t.alternatives) {
        children.push(docxParagraph(`Alternatives: ${t.alternatives}`, { italics: true, color: "6b7280" }));
      }
    });
  }

  const tv = content.technicalViability;
  if (tv.assessment || tv.rating || tv.scalability || tv.security || tv.risks.length || tv.mitigations.length) {
    children.push(docxHeading("Technical Viability"));
    if (tv.rating) children.push(docxParagraph(`Feasibility: ${tv.rating}`, { bold: true }));
    const assessment = docxParagraph(tv.assessment);
    if (assessment) children.push(assessment);
    if (tv.scalability) children.push(docxParagraph(`Scalability: ${tv.scalability}`));
    if (tv.security) children.push(docxParagraph(`Security: ${tv.security}`));
    if (tv.risks.length) {
      children.push(docxHeading("Risks", HeadingLevel.HEADING_2));
      children.push(...docxBullets(tv.risks));
    }
    if (tv.mitigations.length) {
      children.push(docxHeading("Mitigations", HeadingLevel.HEADING_2));
      children.push(...docxBullets(tv.mitigations));
    }
  }

  if (content.featureLinkages.length) {
    children.push(docxHeading("Feature Linkage"));
    content.featureLinkages.forEach((f) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: f.feature || "Feature", bold: true, size: 24 })],
          spacing: { after: 60 },
        })
      );
      const description = docxParagraph(f.description);
      if (description) children.push(description);
      if (f.components.length) children.push(docxParagraph(`Components: ${f.components.join(", ")}`));
      if (f.dependsOn.length) children.push(docxParagraph(`Depends on: ${f.dependsOn.join(", ")}`));
    });
  }

  if (content.schemas.length) {
    children.push(docxHeading("Data Schemas"));
    content.schemas.forEach((sch) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: sch.name, bold: true, size: 24 })],
          spacing: { after: 60 },
        })
      );
      const description = docxParagraph(sch.description);
      if (description) children.push(description);
      sch.fields.forEach((fl) => {
        const line = `${fl.name} (${fl.type || "—"})${fl.description ? ` — ${fl.description}` : ""}`;
        children.push(docxParagraph(line, { font: "Courier New" }));
      });
    });
  }

  if (content.erd.mermaid || content.erd.entities.length || content.erd.relationships.length) {
    children.push(docxHeading("Entity Relationship Diagram (ERD)"));
    if (content.erd.mermaid) {
      children.push(docxParagraph("Mermaid ERD", { bold: true, size: 20, color: "6b7280" }));
      children.push(docxParagraph(content.erd.mermaid.replace(/\\n/g, "\n"), { font: "Courier New", size: 18 }));
    }
    content.erd.relationships.forEach((r) => {
      const label = r.label ? ` · ${r.label}` : "";
      children.push(docxParagraph(`${r.from} ${r.cardinality || "—"} ${r.to}${label}`));
    });
  }

  if (content.workflow.description || content.workflow.steps.length || content.workflow.mermaid) {
    children.push(docxHeading("Project Workflow"));
    const wfDescription = docxParagraph(content.workflow.description);
    if (wfDescription) children.push(wfDescription);
    if (content.workflow.mermaid) {
      children.push(docxParagraph("Mermaid flowchart", { bold: true, size: 20, color: "6b7280" }));
      children.push(docxParagraph(content.workflow.mermaid.replace(/\\n/g, "\n"), { font: "Courier New", size: 18 }));
    }
    content.workflow.steps.forEach((st) => {
      const actor = st.actor ? `${st.actor}: ` : "";
      const outcome = st.outcome ? ` → ${st.outcome}` : "";
      children.push(docxParagraph(`${st.step}. ${actor}${st.action}${outcome}`));
    });
  }

  const doc = new Document({ sections: [{ children: children.filter(Boolean) }] });
  return Packer.toBuffer(doc);
};

export const generateArchitectureFile = async (rawContent, format) => {
  const content = normalizeContent(rawContent);
  if (format === "docx") return buildDocxBuffer(content);
  return buildPdfBuffer(content);
};

export { normalizeContent };
