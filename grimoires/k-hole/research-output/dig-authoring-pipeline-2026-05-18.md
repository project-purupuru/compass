
## Dig: Authoring → consumer pipeline UX in creative tools: Substance Designer node graph for material authoring · Figma components + variants + properties · Photoshop smart objects · how master assets propagate to instances and how edits round-trip. Context: Gumi authors cards in a separate tool (purupuru-cards), exports to a codex; compass renders. Need UX patterns for keeping the kitchen (authoring) and frontend (game) in sync without rebuilding render code each time the export shape changes.
_2026-05-18T23:22:44.862Z | 20 sources | 788.9s | depth: ++_

### Findings

**Sébastien Deguy’s Substance Engine** architecture treats the export not as a static asset, but as a "Recipe"—a directed acyclic graph (DAG) exported in a "renderer-agnostic" bytecode format. This allows the authoring tool to remain the "kitchen" while the frontend acts as a "player" that interprets the recipe at runtime [1][9]. (adjacent) This mirrors the **PostScript / PDF** model, where the source file describes *how* to draw a path or fill a shape rather than providing the final pixels, enabling the printer (renderer) to remain oblivious to the specific creative tool used to generate the primitives.

**Pixar’s Hydra framework**, a core component of Universal Scene Description (USD), enforces a strict separation between the **Scene Delegate** (the data source) and the **Render Delegate** (the display engine). By utilizing a "decoupling layer" that maps arbitrary data attributes—like `get_property("health")`—to a generic attribute API, authors can introduce new properties in the "kitchen" without the "frontend" requiring a recompile to handle the data shape change. (bridge) This structure suggests that Gumi’s **Codex** should function as a "Scene Delegate" that emits attribute-change events, while **Compass** behaves as a "Render Delegate" that observes only the properties it has registered a visual capability for.

**Sho Kuwamoto’s Figma Component Properties** architecture solved the "variant explosion" problem by storing only the "diff" or metadata overrides against a master schema. Similarly, **Native Instruments' NKS (Native Kontrol Standard)** uses a JSON metadata wrapper to map dynamic software parameters in the "kitchen" to a fixed set of physical hardware knobs. (adjacent) This maps onto **Biological Epigenetics**, where the DNA (the Master Codex) remains static, but "methyl tags" (overrides) determine which parts are "rendered" or expressed in a specific environment, allowing for drastic variation without altering the base blueprint.

**Bret Victor’s "Ladder of Abstraction"** argues that an author requires a "direct connection" to their medium, necessitating a live-link where the "frontend reacts without a build step." (adjacent) This philosophy echoes the **Smalltalk-80** environment, where the distinction between "tool" and "result" is erased, and every object is "live" and inspectable in its final environment. (bridge) For the `purupuru-cards` pipeline, this implies moving away from an "Export" button toward a **Shared Memory Buffer**, where Compass renders directly from the current state of the authoring tool, treating the Codex not as a file, but as a live stream of property-update events.

### Pull Threads

- **Pixar USD Hydra SceneIndex API specification** — To understand the interface required to keep the renderer agnostic of the data source shape.
- **Native Instruments NKS metadata schema documentation** — To see how a fixed UI (frontend) can map to dynamic parameters from a separate authoring tool.
- **Rive Runtime state machine 'Inputs' vs 'Layers' logic** — To explore moving interactive logic (like card animations) from hardcoded code into the exported asset.
- **Figma Component Properties 'Instance-level overrides' storage model** — To learn how to propagate edits from a master asset to instances without re-sending the entire asset.

### Emergence

A recurring tension exists between the **"Bake"** (optimized, static, file-based) and the **"Live"** (dynamic, stream-based, memory-shared) paradigms of asset propagation. The most resilient pipelines move from **Asset-Driven Rendering** (where the engine knows the "Card" class) to **Capability-Driven Rendering**, where the engine provides a registry of "hooks" (e.g., "I can render text," "I can render a glow") and the authoring tool simply provides a mapping that wires data fields to those hooks at runtime.

### Sources
- [Photoshop Smart Objects Propagation & Round-Trip - YouTube](https://www.youtube.com/watch?v=f-V1t-G-06I)
- [Adobe Research: Rubaiat Habib Kazi Publications](https://rubaiathabib.me/publications/)
- [Sébastien Deguy - The Science and Technology of Substance - YouTube](https://www.youtube.com/watch?v=0w5_v0pS62Q)
- [Framer: Design-to-Site Architecture](https://www.framer.com/blog/how-framer-works/)
- [Figma: Component Properties Engineering Deep Dive](https://www.figma.com/blog/behind-the-feature-component-properties/)
- [How Photoshop Smart Objects Work - Adobe Support](https://helpx.adobe.com/photoshop/using/create-smart-objects.html)
- [Headless CMS Live Preview Patterns - Storyblok](https://www.storyblok.com/tp/visual-editor-setup)
- [The Architecture of Substance Designer - Kitware Case Study](https://www.kitware.com/from-one-software-to-many-at-allegorithmic/)
- [Bret Victor: Seeing Spaces](http://worrydream.com/SeeingSpaces/)
- [RealityTalk: Real-time AR Authoring - ACM Digital Library](https://dl.acm.org/doi/10.1145/3472749.3474783)
- [Figma: Building a professional creative tool on the web](https://www.figma.com/blog/building-a-professional-creative-tool-on-the-web/)
- [Design Engineering Handbook - InVision](https://www.invisionapp.com/inside-design/design-engineering-handbook/)
- [Rive: The State Machine](https://rive.app/community/doc/state-machine/doc96qWfDk5q)
- [NVIDIA: OpenUSD Composition Fundamentals](https://docs.omniverse.nvidia.com/usd/latest/composition/composition_fundamentals.html)
- [Bungie: Destiny 2 Asset Pipeline (GDC)](https://www.gdcvault.com/play/1025345/Bungie-s-Asset-Pipeline-Destiny)
- [Speckle: The Data Platform for AEC](https://speckle.systems/blog/what-is-speckle/)
- [Rhino.Inside.Revit Guides](https://www.rhino3d.com/inside/revit/1.0/guides/)
- [VCV Rack: SDK Documentation](https://vcvrack.com/manual/SDK)
- [Mark Dalgleish: A Unified Styling Language](https://www.youtube.com/watch?v=z-8thVTM_K4)
- [Jason Gregory: Game Engine Architecture](https://www.gameenginebook.com/)

---
