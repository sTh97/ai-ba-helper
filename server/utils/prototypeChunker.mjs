import { buildInitialStructure } from "./prototypeBuilder.mjs";

export const planPrototypeChunks = (stories, projectName, prototypePrompt = "") => {
  const structure = buildInitialStructure(stories, projectName, prototypePrompt);
  const screens = structure.screens || [];

  const chunks = [
    { id: "scaffold", label: "Building scaffold preview", phase: "scaffold" },
    { id: "structure", label: "Refining screen map", phase: "structure" },
    ...screens.map((screen, index) => ({
      id: `screen-${screen.id}`,
      label: `Screen ${index + 1}: ${screen.title || screen.id}`,
      phase: "screen",
      screenId: screen.id,
      screenIndex: index,
    })),
    { id: "assemble", label: "Assembling final prototype", phase: "assemble" },
  ];

  return { structure, screens, chunks, totalChunks: chunks.length };
};
