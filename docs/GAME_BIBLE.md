# Project Firefly — Master Game Bible

Reference-inspired 2D browser game for CrazyGames

Document type: Game design, art direction, technical architecture and production bible
Working project name: Project Firefly
Primary engine: Phaser + TypeScript
Build environment: Claude Code
Art pipeline: Scenario
Motion and cinematic development: Higgsfield
Distribution target: CrazyGames
Creative target: Approximately 80% similar in gameplay feel and visual appeal to the supplied reference, with an original identity, original assets and its own signature mechanic.

## 0. The mission

Build a polished, instantly playable 2D web game that captures the qualities that make the reference compelling: its core interaction pattern, moment-to-moment rhythm, visual hierarchy, animation language, responsiveness, readability and reward feedback.

Do not reproduce the original game's exact assets, branding, characters, maps, interface artwork, sound recordings or distinctive level designs.

The result must feel like a close relative of the reference rather than a clone. Keep the successful design principles; create a new expression of them.

Definition of success

A player opening the game on CrazyGames should be able to:

Understand what to do almost immediately.

Experience a satisfying core interaction within the first few seconds.

See responsive animations and meaningful feedback after actions.

Discover additional depth without having to read a wall of instructions.

Play smoothly at different browser sizes and on supported devices.

Enjoy a complete gameplay loop rather than a static visual demonstration.

Recognise a cohesive, original art direction throughout the entire game.

Non-negotiable principle: No amount of visual polish compensates for unresponsive controls, unclear objectives, fake UI, broken progression or shallow gameplay.

## 1. Reference analysis: mandatory pre-production gate

Before writing the gameplay code or generating a large batch of assets, study the supplied reference footage.

Do not invent the reference's gameplay genre, rules, character abilities, camera movement or progression. Derive those details from the footage.

### 1.1 Reference inspection

Locate the supplied video. If it is not accessible to the coding environment, request that the owner place a usable copy in:

assets/reference/reference-gameplay.mp4

Use FFmpeg or a small Python/OpenCV utility to generate a contact sheet sampled throughout the video. Inspect enough frames to understand both the ordinary gameplay and the distinctive moments.

Create these files:

docs/reference-analysis.md

docs/reference-observations.md

docs/reference-gameplay-flow.md

docs/reference-style-study.md

docs/originality-decisions.md

Do not proceed to a full content-production batch until the first three documents contain evidence-based observations.

### 1.2 What to record

For each significant part of the reference, record a timestamp, an observation, its apparent purpose and the adaptation decision.

Category
Questions to answer

Game identity
What genre or hybrid is it? What is the player trying to accomplish?

Core verbs
What does the player repeatedly do: move, aim, select, dodge, attack, match, build, collect or another action?

Controls
Mouse, keyboard, touch, drag, click, continuous input or a combination?

Gameplay loop
What triggers a challenge, what resolves it, and what happens afterwards?

Character behaviour
How does the player or principal game object accelerate, stop, react, attack or recover?

Camera
Fixed, scrolling, tracking, zooming, following a target or switching scenes?

Spatial layout
Arena, grid, open map, lanes, platforms, room-based levels or another arrangement?

Challenge
What threatens progress? How are threats communicated before they become dangerous?

Feedback
Which particles, flashes, sounds, pauses, effects or UI changes communicate successful actions?

Difficulty
How does pressure increase? What changes between easy and difficult moments?

Rewards
What creates a sense of completion, improvement or anticipation?

Visual language
Pixel density, palette, silhouette, outlines, materials, shadows, background detail and animation timing.

Interface
Information hierarchy, persistent HUD, menus, popups, counters and interaction states.

Audio
Music mood, ambience, action sounds, reward sounds, intensity and silence.

Replay
What makes the player want another attempt or another session?

Separate direct observations from interpretations. When an observation is uncertain, label it as uncertain instead of turning it into a false fact.

### 1.3 Build the reference gameplay specification

Fill out the following template from the footage.

Genre and subgenre: To be determined from the footage.

Primary player objective: To be determined.

Primary repeatable action: To be determined.

Secondary actions: To be determined.

Player failure or completion condition: To be determined.

Core challenge pattern: To be determined.

Progression structure: To be determined.

Average meaningful gameplay cycle: To be measured or estimated from the recording.

Camera model: To be determined.

Control model: To be determined.

Key animation beats: To be recorded with timestamps.

Most satisfying moment: To be identified from the footage.

Three defining visual characteristics: To be documented.

Three defining sound or feedback characteristics: To be documented.

Only fill these fields once the evidence has been reviewed.

### 1.4 The 80/20 similarity framework

The similarity target is about the experience, not copied content.

Preserve the reference's successful design principles:

The same broad category of player motivation.

A comparable type of repeated interaction.

A similar amount of input complexity.

Comparable pacing, feedback density and challenge escalation.

Similar readability at ordinary gameplay zoom.

A compatible level of visual richness, animation responsiveness and atmosphere.

Similar emotional rhythm: anticipation, action, feedback and reward.

Create original expression through:

A new game name, premise and visual identity.

Original player, enemy, object and environment designs.

New maps, layouts, compositions and stage arrangements.

Original sound effects and music.

A distinct menu, HUD and icon family.

New challenge patterns and content.

One signature gameplay mechanic that creates a meaningful difference.

Do not mechanically change exactly 20% of the game. The percentage is a creative direction, not an asset-count rule.

### 1.5 Similarity audit

For every proposed feature, mark it as one of the following:

Retain principle: A general gameplay or UX principle worth preserving.

Adapt: A mechanic that can remain familiar but needs different implementation, balancing or presentation.

Replace: An expressive element that should be new.

Reject: A copied asset, layout or detail that should not enter the project.

Record important decisions in docs/originality-decisions.md.

## 2. Game design charter

### 2.1 Core concept

The final concept must be written after the reference inspection.

Produce one sentence in this format:

“Players [primary action] to [immediate objective], while managing [principal challenge], gradually unlocking or mastering [progression system].”

Do not create several competing game concepts or combine unrelated genres to make the game seem larger.

### 2.2 Core-loop architecture

Whatever the reference's specific genre, the design must have a complete loop:

Enter gameplay → understand the situation → take an action → receive clear feedback → encounter a consequence or reward → face the next decision → progress, fail or complete the session.

Use the reference footage to determine the actual actions and state transitions. Do not assume this necessarily means combat, platforming, waves, inventory management or any particular genre.

The first playable build must implement one entire loop, not just movement and a pretty background.

### 2.3 The new signature mechanic

Design one original system that distinguishes this game without destroying the reference's accessible gameplay feel.

The signature mechanic must:

Be understandable through play rather than a tutorial essay.

Reinforce the core loop instead of distracting from it.

Have a visible and satisfying visual response.

Introduce meaningful choices or skill expression.

Be technically feasible for a browser game.

Remain useful after the first few minutes.

Be possible to test and tune independently.

Develop three proposals and score each on clarity, novelty, implementation cost, visual potential and replay value. Select one before implementing it.

Do not add unnecessary crafting, complicated skill trees, online multiplayer, sprawling inventories or procedural world systems unless the reference-derived design specifically benefits from them.

### 2.4 Gameplay pacing

Establish initial tuning targets during prototyping, then revise them through playtesting.

The opening should demonstrate the main interaction quickly.

The first meaningful success should not require mastery.

The player should be able to understand why an action succeeded or failed.

Additional complexity should arrive gradually.

Repeated actions should evolve through challenges, decisions, combinations or rewards.

Long periods without decisions or feedback should be intentional, not accidental.

Difficulty must increase through understandable patterns rather than arbitrary punishment.

Maintain a pacing table that documents introductory, early, middle and advanced play.

### 2.5 Difficulty and fairness

A challenge must be readable before it demands a response. If the game includes hazards or enemies, distinguish their warning, active and recovery phases. If it uses timing, matching or strategic choices instead, ensure the required condition is legible.

Never rely on unfair surprise to simulate difficulty.

Every failure should teach the player something about the rules, their decisions or their timing.

## 3. Art direction bible

### 3.1 The visual north star

Create a coherent pixel-art world that looks intentionally art-directed. It must not feel like a bundle of unrelated images generated by different AI models.

The reference analysis determines the precise palette, density, rendering style and proportions. Until then, the following principles are provisional standards.

Distinct silhouettes.

Controlled pixel clusters rather than random single-pixel noise.

Consistent outline thickness and corner treatment.

A deliberate light direction.

Foreground elements that remain readable against the background.

Strong separation between interactive objects and decoration.

A restricted, reusable palette.

Carefully placed highlights and shadows.

Background detail that supports the gameplay rather than competes with it.

Original motifs, materials, symbols and shape language.

Create a one-page visual style sheet before building the full asset library.

### 3.2 Pixel grid and logical resolution

Choose the logical resolution and sprite scale after reviewing the footage.

Candidate logical resolutions include 320×180, 384×216 or 480×270 for a 16:9 presentation, but none is mandatory. A dense, detailed reference may need a different approach.

Set a consistent grid for the world, major characters, props, environment tiles and UI elements.

Do not mix sharply pixelated characters with smooth, high-resolution illustrated environments unless that contrast is an intentional, documented art-direction choice.

Rendering rules

Use nearest-neighbour sampling for pixel artwork.

Avoid unintended texture filtering, blurry scaling or fractional pixel positions.

Prefer integer scaling when the viewport permits it.

Align camera and sprite positions to the chosen pixel grid where practical.

Prevent moving objects from shimmering because of inconsistent rounding.

Test UI text independently so that it remains legible at small browser sizes.

In Phaser, configure pixel-art rendering and texture filtering intentionally. Verify the result in the actual running browser; configuration flags alone are not a substitute for visual inspection.

### 3.3 Palette specification

Build a role-based palette instead of selecting colours separately for every asset.

Palette role
Intended use

Deep background
Distant backdrop and darkest environment shapes

Structural shadow
Dark edges, outlines and foreground separation

Main material colours
Dominant environment and character surfaces

Secondary material colours
Variation within the principal forms

Light planes
Readable surfaces and form definition

Highlight colours
Specular details and visual emphasis

Interaction accent
Selected objects, active actions and focus states

Danger state
Warnings and threats where appropriate

Success state
Completion and positive feedback

Neutral UI
Text panels, dividers and inactive controls

Sample colour relationships from the reference, then develop an original palette around them.

Maintain enough contrast for important objects to remain recognisable during motion, particles, lighting changes and overlapping effects.

### 3.4 Scene composition

The game world must be beautiful without sacrificing playability.

Define separate rules for:

Primary interactive layer.

Nearby environment layer.

Midground decoration.

Distant backdrop.

Atmospheric effects.

Foreground occlusion, if used.

UI and notification layer.

Give the player a clear focal area. Keep decorative motion slow and subtle when the player is expected to make precise decisions.

Use camera motion only when it improves orientation, impact or drama. Do not add constant camera shake to make the game seem active.

### 3.5 Lighting and effects

Create lighting and effects that respect the pixel-art style.

Prefer intentional bands, dithered shading, limited glow and well-controlled palettes over indiscriminate blur or heavy bloom.

Any glow, tint or post-processing effect must be adjustable and tested for both visual quality and performance. Effects should not make gameplay-critical silhouettes disappear.

Separate decorative effects from functional ones:

Decorative: ambience, dust, distant light and environmental life.

Functional: impact response, interaction confirmation, damage, warnings and rewards.

Functional effects always take priority.

### 3.6 Interface art direction

The UI is part of the game world, not an unrelated web dashboard.

Define:

Type hierarchy and number readability.

Panel shapes and borders.

Button states.

Icon proportions.

Selected, disabled and unavailable states.

Tooltip and notification behaviour.

Modal positioning and scrolling rules.

Consistent spacing and safe margins.

The interface must be legible and complete when rendered at the intended minimum sizes. Never fix a cramped layout by shrinking every element until the interface technically fits.

Do not add a custom fullscreen button: CrazyGames provides fullscreen functionality at the platform level.

## 4. Character, object and environment production

### 4.1 Character bible

For every principal character or game entity, document:

Identity and gameplay function.

Silhouette and proportions.

Front, side or top-down orientation as appropriate.

Main palette and material definitions.

Recognisable identifying features.

Relative scale against the world.

Animation states.

Collision dimensions.

Required effects.

Sound references.

Variations that are allowed.

Details that must remain consistent.

A character's appearance must remain stable between its idle, movement, action, damage and other required states.

### 4.2 Sprite and object animation list

Generate only the animation states justified by the actual gameplay.

A flexible checklist:

Idle or rest.

Primary movement.

Secondary movement, if present.

Main action.

Secondary action.

Anticipation.

Impact or confirmation.

Recovery.

Damage or failure.

Completion or celebration.

Transition or transformation, where relevant.

For non-character objects, define activation, animation, completion and reset states where needed.

Do not make every character perform every animation. Each state must serve a real gameplay purpose.

### 4.3 Environment bible

Establish reusable environmental rules:

Tile and grid dimensions, where applicable.

Ground plane and depth conventions.

Collision and walkable surfaces.

Decorative versus interactive props.

Background layer movement.

Repeatable patterns.

Environmental colour variations.

Lighting and weather states, if justified.

Original landmark silhouettes and distinctive scene motifs.

A level must be designed around how the player uses it, not merely around how impressive it looks in a screenshot.

### 4.4 Asset manifest

Maintain docs/asset-manifest.csv with the following fields:

asset_id, asset_name, category, source_tool, source_asset_id, original_file, gameplay_role, dimensions, pivot, scale, animation_states, palette, review_status, implementation_path, license_notes

Use stable identifiers. A gameplay object should not require code changes merely because its final art file was renamed.

## 5. Scenario production workflow

Scenario is the primary production tool for consistent, reusable visual assets.

### 5.1 Establish the master art model

First create a small, original visual reference set.

It should show the intended style across different content types: character shapes, environment materials, interactive objects, effects and UI components.

Review these samples for consistency before training or selecting the final model.

If the samples justify it, train or fine-tune a custom Scenario style model using art that the project owns or is permitted to use. Do not train the game's visual identity by directly copying a competitor's sprite sheets, logos or proprietary assets.

Store the chosen model ID, asset IDs, tested generation settings and prompt conventions in docs/scenario-art-pipeline.md.

### 5.2 The asset-generation sequence

Follow this sequence for each new asset family:

Write the asset specification and gameplay purpose.

Choose a suitable Scenario model and inspect its capabilities.

Estimate the cost of the first generation and any variants.

Generate a small number of candidates.

Inspect the candidates at actual game size against the intended background.

Choose one approved design.

Derive variants from the approved source asset rather than generating everything independently.

Correct transparency, palette, cropping and pixel structure where needed.

Integrate it into a real game scene.

Record its source ID and review result.

Do not automatically generate hundreds of assets in one batch. A flawed art direction becomes much more expensive after it has spread through the entire game.

### 5.3 Scenario prompt template

Use the following template and replace each bracketed field with specific production instructions.

Asset prompt

Create an original, production-ready 2D pixel-art [asset type] for a browser game.

Gameplay purpose: [what the player reads or does with it].

Visual identity: [approved art bible and Scenario style model].

Silhouette: [distinct shape and proportions].

View and orientation: [top-down, side-on, three-quarter or the confirmed reference-derived perspective].

Palette: [approved palette roles and colours].

Lighting: [approved light direction, shadow style and highlights].

Pixel treatment: clean pixel clusters, consistent scale, deliberate shading and controlled outlines.

Background: transparent if required, with no unnecessary backdrop or floor plane.

Composition: centred and contained inside the canvas, with sufficient space for the required pivot and animation.

Consistency: follow the approved source asset and do not redesign its identity.

Exclusions: no text, watermark, signature, unrelated props, random extra details or changes to the established rendering style.

Output: deliver the requested dimensions and format if supported. Record any conversion, trimming or pixel-cleanup steps required for engine integration.

For icons, use a separate simplified prompt specifying the actual display size. For environmental assets, explicitly define tiling, repetition and collision implications.

AI output is a source asset, not an unquestionable final product. Inspect it, correct it and test it in the build.

### 5.4 Animation production through Scenario

Do not expect an image generator to produce a flawless sprite sheet with identical proportions and pixel placement across every frame.

Instead:

Generate and approve the base design.

Produce animation poses or variants using the approved source.

Check alignment and silhouette consistency.

Clean and slice the frames.

Assemble a named sprite sheet or texture atlas.

Define playback speed and frame order in Phaser.

Test the animation against the actual hitboxes and game timing.

Use procedural animation for effects that are easier to express in code, such as impact flashes, small position offsets, controlled rotation, particles and gentle ambient movement.

## 6. Higgsfield production workflow

Higgsfield complements the game's art and animation pipeline. It is not the authoritative implementation of the gameplay.

### 6.1 Appropriate uses

Use Higgsfield for:

Exploring lighting, atmosphere and environmental mood.

Developing visual references for cinematic moments.

Comparing alternative visual treatments before committing to an art direction.

Producing concept motion to help plan a transition or major event.

Creating original trailers and promotional sequences.

Generating supplemental visual material when a suitable output format exists.

If the reference has a distinctive action or transition, study its timing and emotional purpose. Develop an original sequence that serves the same purpose without copying its exact composition.

### 6.2 What should remain in Phaser

Keep the following deterministic and responsive in the game engine:

Player control and movement.

Collision and hit detection.

Enemy or object logic.

Interactive effects.

Rewards and notifications.

In-game transitions that must respond to player input.

Core animation states.

All gameplay-critical visual information.

Generated video often introduces frame-to-frame drift, inconsistent silhouettes, camera changes and details that cannot be reliably controlled. These can be acceptable in a cinematic, but not in a player-controlled sprite animation that must align precisely with collision and gameplay timing.

### 6.3 Higgsfield prompt template

Create an original motion study for a 2D pixel-art browser game.

Purpose: [the moment or effect being explored].

Visual reference: use the approved project art direction and original project assets.

Style: preserve the original palette, silhouettes, lighting logic, material treatment and pixel density.

Action: [describe the action and its emotional purpose].

Motion arc: [anticipation, action, peak, recovery].

Camera: [static, tracking or other deliberate choice].

Duration: [target duration].

Restrictions: no new characters, no design changes, no unrequested scene cuts, no invented logos, no illegible text and no photorealistic rendering unless specifically required.

Deliverable purpose: visual reference or promotional footage. The final interactive game animation will be implemented and tested inside Phaser.

### 6.4 Credit control

Before any expensive generation or batch job, request a cost estimate. Generate a small proof, review it, then approve further production.

Do not spend project credits generating a full animation catalogue before the first gameplay slice works.

## 7. Claude Code development architecture

### 7.1 Technology stack

Use a TypeScript-based Phaser project with Vite for local development and bundling.

Pin the selected Phaser dependency and compatible package versions in the package manifest. Use official framework documentation when implementing features; do not invent APIs or mix examples from incompatible versions.

Recommended division of responsibilities:

Phaser: world rendering, input integration, gameplay scenes, animation, cameras, physics and effects.

TypeScript: game systems, entities, interfaces, configuration and reusable logic.

Vite: development server and production build.

Scenario: primary game-art asset pipeline.

Higgsfield: motion exploration and promotional material.

CrazyGames SDK: platform events, saving or account functionality where needed, and approved monetisation integrations.

Browser tools: gameplay inspection, performance profiling and responsive-layout testing.

Avoid adding a second game engine, a heavy UI framework or multiple overlapping physics libraries without a proven need.

### 7.2 Suggested project structure

project-firefly/
├── assets/
│   ├── reference/
│   ├── characters/
│   ├── environments/
│   ├── objects/
│   ├── effects/
│   ├── ui/
│   ├── audio/
│   └── atlases/
├── docs/
│   ├── GAME_BIBLE.md
│   ├── reference-analysis.md
│   ├── reference-observations.md
│   ├── reference-gameplay-flow.md
│   ├── reference-style-study.md
│   ├── originality-decisions.md
│   ├── visual-style-guide.md
│   ├── animation-catalog.md
│   ├── scenario-art-pipeline.md
│   ├── asset-manifest.csv
│   ├── gameplay-spec.md
│   ├── technical-architecture.md
│   └── qa-checklist.md
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── config/
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── systems/
│   │   ├── input/
│   │   ├── ui/
│   │   ├── effects/
│   │   ├── audio/
│   │   ├── persistence/
│   │   └── platform/
│   └── utils/
├── tests/
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
Adjust the structure to the actual game's complexity. These folders are a guide, not permission to create empty files and unnecessary abstraction.

### 7.3 Scene design

Create only the scenes that the design requires. A possible architecture is:

BootScene: minimal startup and error handling.

PreloadScene: load essential assets and initialise the platform adapter.

MainMenuScene: a menu only if it improves the actual experience.

GameplayScene: authoritative gameplay simulation and world rendering.

HUDScene: persistent gameplay information, if separate layering is useful.

PauseScene or pause overlay: accessible pause and settings.

ResultsScene: completion, failure, score or progression where relevant.

A game that benefits from immediate play should start directly in the playable state. Do not add a title screen, sign-up form or multiple modal steps just to make the project appear sophisticated.

### 7.4 Systems

Keep major systems isolated when they have independent responsibilities.

Examples include:

InputController: normalised keyboard, mouse and touch actions.

GameplayController: high-level interaction rules.

EntityStateMachine: valid entity states and transitions.

SpawnDirector: spawn scheduling if relevant.

CollisionSystem: contact and interaction resolution.

AnimationController: mapping game state to animation state.

EffectsController: reusable particles, flashes, impact effects and camera response.

AudioController: sound effects, music and audio settings.

ProgressionSystem: unlocking and progression logic where applicable.

PersistenceService: saving and loading supported data.

PlatformAdapter: CrazyGames SDK lifecycle and capability handling.

DebugTools: development-only inspection and reset controls.

Do not create systems solely to match this list. Keep the code understandable and proportionate to the design.

### 7.5 Game-state discipline

All gameplay-changing events should pass through explicit logic.

Examples: beginning a run, starting an interaction, confirming a hit, finishing an objective, entering a failure state, collecting a reward or restarting.

Prevent invalid transitions such as:

Two overlapping starts.

Multiple completion events for the same action.

Controls remaining active after a modal opens.

Enemies or timers continuing during a true pause.

Input being processed twice due to simultaneous mouse and touch handlers.

Effects or audio continuing indefinitely after scene changes.

Use a small, explicit state machine for each major entity instead of hiding state inside unrelated booleans.

### 7.6 Frame-rate-independent behaviour

The gameplay must remain consistent across monitor refresh rates.

Use the game engine's time and physics systems correctly. Avoid multiplying movement by frame count or assuming exactly 60 updates per second.

Separate gameplay timing from cosmetic animation timing when necessary. Test at different frame rates and during temporary slowdowns.

For significant interactions, allow a controlled amount of anticipation, response and recovery. Any hit-stop or camera shake must be brief, intentional and adjustable rather than disruptive.

## 8. Animation bible: preserve the beauty

Animation is a core gameplay system, not a finishing touch.

### 8.1 Every important interaction needs a motion plan

For each major action, document:

Starting state.

Anticipation.

Main motion.

Peak impact or confirmation.

Reaction.

Recovery.

Return to the appropriate state.

Not every action needs all seven phases. Use them when they serve the original gameplay rhythm.

### 8.2 Animation inventory

Create docs/animation-catalog.md. For every animation, record:

animation_id, owning_entity, trigger, start_state, end_state, frame_count, fps, loop, root_motion, interruption_rules, gameplay_timing, fallback

Give assets descriptive, stable names. Avoid untracked, unnamed sprite frames or animation definitions hidden inside scene code.

### 8.3 Animation states must follow gameplay states

The animation should tell the player what is happening.

For example, a state change should not be driven purely by elapsed time if it depends on player input or collision. A character that completes an action early should not keep showing an active action frame after the gameplay state has changed.

Conversely, if an action intentionally commits the player for a brief period, document that lockout and communicate it visually.

### 8.4 Layered motion

Combine authored sprite animation and procedural effects where appropriate.

Sprite frames convey body movement and character personality.

Position and rotation offsets convey weight.

Particles communicate force or change.

Brief flashes clarify confirmation or damage.

Small camera responses reinforce major impacts.

Ambient motion keeps the world alive during quieter moments.

UI animation acknowledges the user's input.

Do not apply every effect to every action. Keep the hierarchy clear.

### 8.5 Animation timing and quality control

Set animation rates from the reference study and actual gameplay. Do not automatically force all animations to the same frame rate.

Test at real game size, not only when enlarged in an asset viewer.

Check:

Frame order and loop seams.

Cropped edges and inconsistent pivots.

Flicker due to misalignment.

Sudden scale or silhouette changes.

Hitbox timing.

Directional consistency.

Readability over complex backgrounds.

Correct interruption and recovery.

Absence of blurry resampling.

If a generated animation is weaker than a smaller, carefully authored sequence, use the authored sequence.

## 9. Controls and usability

### 9.1 Control mapping

Derive the primary control style from the reference. Do not impose keyboard movement on a game built around mouse selection, or vice versa.

Provide one primary method of interaction and avoid requiring combinations of keys for ordinary play unless the game genuinely needs them.

An optional desktop mapping may use WASD or arrow keys for movement, Space for a primary action and Esc for pause—but only where those choices suit the reference-derived game.

### 9.2 Input abstraction

Represent actions independently of the device.

For example, the gameplay system should respond to a logical action such as primaryAction, not separately implement unrelated keyboard, mouse and touch versions of the same mechanic.

This allows desktop and mobile controls to share the same gameplay behaviour.

### 9.3 Touch support

If mobile is supported, provide appropriately sized touch controls that remain comfortably inside safe areas.

Avoid placing essential controls underneath platform overlays or the edges of the viewport.

Touch controls must not block important information, overlap frequently used actions or create accidental page interactions.

### 9.4 First-play experience

Demonstrate the primary verb through a real interaction as quickly as the game allows.

A short animated prompt is preferable to a lengthy tutorial. Use a single focused hint for the current challenge, then remove it when the player understands or successfully performs the action.

Support pause and restart behaviour consistently. Keep sound and accessibility settings in predictable locations.

## 10. Sound and audio feedback

Use original audio or assets with the appropriate licence.

Create a simple audio bible covering:

Main ambience and music direction.

Core interaction sounds.

Success and reward sounds.

Failure and warning sounds.

Movement or environmental feedback where useful.

UI confirmation and error sounds.

Volume hierarchy.

Variations for frequently repeated effects.

Frequently repeated sounds should have enough variation or controlled cooldown to avoid becoming irritating.

Audio must not be required to understand an essential visual instruction. Provide a functional mute control and separate music and effect volume when practical.

Browser audio can require a user gesture to start. Initialise and resume playback appropriately, handle suspended audio contexts, and test the experience in supported browsers.

## 11. CrazyGames implementation requirements

CrazyGames is the distribution target from the beginning, not something to add after finishing the game.

Verify requirements against the official documentation before submission:

Requirements overview: https://docs.crazygames.com/requirements/intro/

Technical requirements: https://docs.crazygames.com/requirements/technical/

Gameplay requirements: https://docs.crazygames.com/requirements/gameplay/

SDK overview: https://docs.crazygames.com/sdk/intro/

### 11.1 SDK

Use the current supported HTML5 SDK and read its latest Phaser-compatible integration details.

The current HTML5 v3 documentation uses:

https://sdk.crazygames.com/crazygames-sdk-v3.js

It requires explicit initialisation, including awaiting window.CrazyGames.SDK.init() before using SDK functionality. Follow the exact current documentation for game start/stop events and data operations.

Keep SDK integration behind PlatformAdapter rather than scattering direct SDK calls through gameplay code.

The adapter must handle environments where the production SDK is disabled or unavailable, so ordinary development and gameplay do not crash.

Never fake an SDK event merely to pass an integration test. A gameplay-start event should occur only when the game reaches the relevant playable state.

### 11.2 Platform requirements

Design against these current published limits and verify them again before submission:

Maximum total game size: 250 MB.

Initial download size: at most 50 MB.

Mobile-homepage eligibility target: at most 20 MB initial download.

Maximum number of game files: 1,500.

Externally loaded assets must not make time to playable state exceed the platform's stated limit.

Only relative paths should be used for assets within the game bundle.

Treat 20 MB as an optimisation target, not an invitation to sacrifice the artwork. Compress and organise assets intelligently before removing the elements that make the game look good.

### 11.3 Landing and navigation

For a Full Launch, the platform requires new users to reach gameplay immediately where feasible, otherwise within one click.

Do not force account creation, a newsletter, a lengthy introduction or an unnecessary title screen before play.

CrazyGames provides fullscreen functionality. Do not create your own in-game fullscreen button.

Do not add disallowed cross-promotion or external advertisements. Use the platform's approved SDK integrations when eligible and required; do not fake rewarded-ad flows or display ads in a Basic Launch when they are prohibited.

### 11.4 Quality assurance

The game must:

Have readable text at the target platform's tested viewport sizes.

Maintain consistent physics across different refresh rates.

Support the required mouse, keyboard and touch interaction modes.

Run without fatal errors, crashes or broken asset references.

Start quickly and remain smooth on modest hardware.

Provide high-quality English text.

Have its own original name, artwork and content.

Run the final package in the CrazyGames Preview tool, not just in the local development server.

## 12. Responsive rendering and performance

### 12.1 Viewport policy

Create a responsive layout and validate it at the platform's documented sizes. In particular, test the common 16:9 desktop embed at 907×510, alongside fullscreen and supported mobile sizes.

Use a logical game resolution with a deliberate scale strategy.

The camera, HUD and input coordinates must remain correct after:

Window resizing.

Entering or leaving platform fullscreen.

Switching orientation on supported mobile devices.

Loading at a different device pixel ratio.

Resuming the game after changing browser focus.

Keep essential information away from unsafe viewport edges.

### 12.2 Pixel-art performance

To preserve the intended visual style while remaining efficient:

Use texture atlases for related assets.

Avoid repeatedly loading duplicated copies of textures.

Reuse effects and frequently spawned objects where beneficial.

Limit the number of large transparent layers stacked over the scene.

Keep decorative animation budgets distinct from gameplay-critical effects.

Use compressed audio and appropriate asset formats.

Load nonessential content on demand when that improves initial download time.

Avoid generating new raster images every frame.

Avoid unnecessary full-screen filters and oversized particle textures.

Do not remove important animation frames simply to reduce the file size. First optimise packing, compression, redundant assets and load order.

### 12.3 Budget and profiling

Measure rather than guess.

Record:

Initial bundle size.

Time to the first playable state.

Texture and audio memory.

Frame-time consistency.

Number of active game objects.

Number of active particles or effects.

Major sources of CPU or GPU load.

Test a representative gameplay moment containing the busiest scene, not just the opening screen.

## 13. Saving and progression

Only implement progression systems that support the actual design.

Potential systems include high scores, unlocks, settings, level progress, achievements or collections, but do not add a progression menu merely to make the game appear more complete.

### 13.1 Persistence rules

Version saved data.

Validate data loaded from the browser or platform.

Handle missing, invalid or outdated data safely.

Make resets deliberate and predictable.

Avoid storing unnecessary personal information.

Keep gameplay operational if cloud saving is unavailable.

Use platform-supported save functionality where appropriate.

Maintain a documented fallback for local development.

Distinguish temporary run state from long-term progression so that restarting a level does not accidentally erase unrelated unlocks.

## 14. Development milestones and approval gates

#### Milestone 0 — Reference lock

Deliverables: Reference analysis, gameplay flow, visual study and originality decisions.

Pass condition: The team can explain the game's actual core loop and the specific visual qualities it intends to preserve without guessing.

#### Milestone 1 — Art-direction proof

Deliverables: One original principal character or interactive object, one small environment sample, one UI sample and a short animation test.

Pass condition: All samples look as though they belong to the same game, remain readable at actual size, and express the chosen original style.

Do not generate the entire asset library yet.

#### Milestone 2 — Playable vertical slice

Deliverables: One complete core gameplay loop with real input, animation, collision or interaction logic, feedback, sound and restart/completion behaviour.

Pass condition: A tester can play it and understand what happened without the developer explaining the code.

#### Milestone 3 — Content and variation

Deliverables: Additional content that reuses approved visual and technical systems, plus the first meaningful expression of the signature mechanic.

Pass condition: Additional content increases variety without creating inconsistent assets or breaking existing gameplay.

#### Milestone 4 — Progression and polish

Deliverables: Required progression, persistence, settings, state transitions, sound balancing and a consistent UI.

Pass condition: There are no fake buttons, dead-end states, unfinished popups or placeholder systems in the player-facing build.

#### Milestone 5 — CrazyGames integration

Deliverables: SDK adapter, responsive behaviour, supported save features, appropriate platform lifecycle handling and initial-size optimisation.

Pass condition: The game starts correctly in local development and passes its SDK checks in the proper testing environment.

#### Milestone 6 — Release candidate

Deliverables: Optimised assets, complete content, final animations, QA records and the submission package.

Pass condition: All critical acceptance tests pass, including those for readability, gameplay, loading and platform integration.

No milestone passes merely because Claude reports that the code was written. It passes when the result is actually tested.

## 15. Required QA checklist

Gameplay

The main objective is clear.

The primary interaction responds immediately.

The core loop is complete.

Difficulty changes are understandable.

Success and failure states work properly.

Restarting does not leave stale entities or old inputs active.

No duplicate score, reward or completion events occur.

No visible behaviour depends incorrectly on frame rate.

Visuals

The art style matches the approved bible.

Principal silhouettes remain recognisable.

Sprite edges are not blurry or unintentionally clipped.

Animation frames are aligned.

Lighting and particles do not hide critical gameplay.

UI elements fit at tested viewport sizes.

No placeholder icons or unrelated images remain.

All interactive controls have clear states.

Technical

No missing assets.

No fatal console errors.

No broken relative paths.

No unhandled scene transitions.

Audio starts and resumes correctly.

Save data is validated.

Production build completes.

Required SDK methods are called at correct lifecycle points.

Initial and total download limits are met.

Release

The production build works outside the development server.

Gameplay begins promptly.

Platform fullscreen is supported without a custom conflicting button.

The game passes the CrazyGames Preview checks.

The game's name, artwork, copy and content are original.

The submission metadata and controls match the shipped game.

## 16. Permanent rules for Claude Code

These rules take precedence over the desire to generate more content quickly.

Read the game bible and the relevant implementation documents before making significant changes.

Inspect the existing project before replacing files, dependencies, structure or art.

Build incrementally and keep the game runnable after each major change.

Never replace working systems with placeholders just to make a demo finish faster.

Never create an entire game in one enormous file if that makes it difficult to test and maintain.

Never use generated artwork without checking its dimensions, rendering, transparency and actual in-game readability.

Never invent API calls; verify the installed framework and current documentation.

Never rewrite unrelated UI or mechanics when asked to fix one small issue.

Never remove polish or animation simply because a static implementation is easier.

Never claim a feature is complete until it has been exercised in the running build.

Keep the master bible updated whenever an approved design decision changes.

When something fails, diagnose the root cause and fix it rather than hiding it.

Before large asset batches, estimate the cost and obtain approval.

Prefer the smallest reliable change that improves the actual game.

Preserve the project's originality, art consistency and core gameplay quality at every stage.

## 17. Prompt pack

#### Prompt A — Initial Claude Code setup

Paste this into Claude Code after placing this bible and the reference video in the project.

Read docs/GAME_BIBLE.md fully before modifying the project.

Begin with Milestone 0 only. Locate the reference video and create a repeatable frame-extraction/contact-sheet workflow. Analyse the footage and write the reference analysis, gameplay-flow, observation and style-study documents.

Do not begin full gameplay implementation yet. Do not generate a large batch of assets yet.

If the video is unavailable, explain precisely what is missing and stop short of inventing mechanics. Inspect the existing repository, check installed tooling, and report what can be established.

Once the evidence-based reference analysis is complete, propose three originalisation opportunities that preserve the same broad player motivation and familiar interaction pattern without copying the game's distinctive content.

Then outline the smallest convincing playable vertical slice, its asset requirements, architecture and test plan. Give me the file-by-file plan before proceeding beyond the reference gate.

#### Prompt B — Scenario style establishment

Use Scenario to establish an original and consistent visual identity for this game.

Read the art direction and reference-analysis documents. Use our approved project concepts, not copied competitor artwork, as the foundation of the asset style.

First, estimate generation costs and show a small proof set. Create original samples representing the core character or interactive object, one environmental material, one gameplay effect and one UI component.

Inspect them at the intended in-game scale. Compare proportions, palette, pixel density, outlines, lighting, silhouette and consistency. Revise the weakest samples before creating further content.

Record the approved model, source asset IDs, prompts, output formats and cleanup requirements. Do not generate the full library until the proof set is approved.

#### Prompt C — Higgsfield visual-development study

Using our original project art and approved visual bible, develop a short motion study for [describe the specific gameplay moment].

The study must clarify anticipation, main movement, impact, recovery, lighting and emotional intent. Maintain the established palette and silhouette language.

Estimate costs first. Generate one low-cost proof and ask for review before variations.

Treat the output as a motion/design reference or promotional shot. Do not substitute the generated video for interactive, collision-synchronised game animation.

#### Prompt D — Vertical slice implementation

Implement Milestone 2 in Phaser and TypeScript using the approved GAME_BIBLE, gameplay specification, asset manifest and art bible.

First inspect the current architecture. Implement the complete core loop, including real controls, game-state transitions, the essential animation states, collision or interaction logic, visual feedback, audio feedback, and proper restart or completion behaviour.

Integrate approved assets rather than creating placeholders. Separate gameplay-critical logic from purely visual effects. Ensure that time-dependent behaviour works across different refresh rates.

Keep the project runnable. Test the actual game at the intended browser viewport, then report the tested behaviours, observed defects and remaining work. Do not claim the milestone passes until its acceptance conditions have been verified.

#### Prompt E — Visual polish pass

Perform a targeted visual-polish pass against docs/visual-style-guide.md and docs/animation-catalog.md.

Do not redesign the gameplay or replace the art direction.

Check sprite alignment, outlines, pixel sampling, animation timing, responsive scaling, camera behaviour, particle density, impact feedback, UI hierarchy and clipping. Inspect the active game, not just individual image files.

Fix the highest-impact inconsistencies first. Preserve working features. Do not remove animation, simplify the visuals or replace the approved assets unless the change produces a demonstrated improvement.

#### Prompt F — CrazyGames release audit

Audit the production build against docs/qa-checklist.md and the current official CrazyGames requirements.

Check initial download size, total package size, relative paths, responsive behaviour, readability, input handling, frame-rate consistency, missing assets, browser errors, SDK initialisation and lifecycle events, audio, persistence and restart behaviour.

Run the production build and test the actual packaged game. Resolve all critical defects and document the remaining limitations. Use the official CrazyGames Preview process before recommending submission.

Do not create a custom fullscreen button, fake platform integration, fake gameplay interactions or placeholder release content.

## 18. Definition of done

The game is ready for submission only when all of the following are true:

Its core gameplay loop is derived from actual reference analysis.

Its art direction is consistent, original and deliberately composed.

Its animations reinforce both the feeling of the game and the player's understanding.

Its main interactions feel responsive.

Its original signature mechanic is fully playable.

Its interface behaves correctly at supported sizes.

Its assets are catalogued and integrated.

Its sound, progression and persistence behave correctly where implemented.

Its CrazyGames integration and package satisfy the current requirements.

The final build has been played, tested and inspected rather than merely generated.

The guiding principle for the entire project: Build the smallest version that proves the complete experience, make that version beautiful and satisfying, then scale it without losing what made it work.

A smaller, finished and beautifully animated game is better than a sprawling, inconsistent game with impressive concept art and half-functional mechanics.
