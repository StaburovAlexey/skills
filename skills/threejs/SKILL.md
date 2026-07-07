---
name: threejs
description: Three.js 3D rendering — scene setup, geometry, materials, lighting, textures, loading, animation, interaction, post-processing, and shaders. Use when creating 3D scenes, working with WebGL/Three.js, building 3D visualizations, games, product configurators, or any Three.js project.
---

# Three.js

Comprehensive Three.js development guide. Use Composition API patterns when integrating with Vue.

## Workflow

1. Confirm Three.js version and module system (ES modules via importmap, npm, or CDN).
2. Identify which topics are needed from the task description.
3. Load only the relevant reference files — see navigation below.
4. Provide complete, runnable code examples with imports.

## Reference Navigation

Load only the files needed for the task:

| Topic | File | When to load |
|-------|------|-------------|
| Scene, cameras, renderer, Object3D, math | [fundamentals.md](references/fundamentals.md) | Always — start here |
| Built-in shapes, BufferGeometry, instancing | [geometry.md](references/geometry.md) | Creating/modifying 3D shapes |
| PBR, Phong, physical, toon materials | [materials.md](references/materials.md) | Styling meshes, texturing |
| Light types, shadows, IBL | [lighting.md](references/lighting.md) | Adding lights, shadow config |
| Texture loading, UV, env maps, render targets | [textures.md](references/textures.md) | Images, HDR, canvas textures |
| GLTF, OBJ, FBX, async loading | [loaders.md](references/loaders.md) | Loading 3D models/assets |
| Keyframe, skeletal, morph, blending | [animation.md](references/animation.md) | Animating objects/characters |
| Raycasting, controls, input, selection | [interaction.md](references/interaction.md) | Click, drag, camera controls |
| Bloom, DOF, SSAO, custom passes | [postprocessing.md](references/postprocessing.md) | Screen-space effects |
| GLSL, ShaderMaterial, custom effects | [shaders.md](references/shaders.md) | Custom vertex/fragment shaders |

## Implementation Defaults

- Import from `three` (npm) or `three/addons/*` for examples/jsm modules.
- Use `THREE.Clock` for frame-rate-independent animation.
- Dispose geometries, materials, and textures when removing objects.
- Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` for performance.
- Set `texture.colorSpace = THREE.SRGBColorSpace` for all color/albedo textures.
- Prefer `MeshStandardMaterial` (PBR) as the default material.
- Use `PCFSoftShadowMap` for shadows when quality matters.

## Final Self-Check

- Renderer, scene, camera, and animation loop are wired correctly.
- All assets are disposed on cleanup.
- Color spaces are correct (sRGB for color maps, Linear for data maps).
- `requestAnimationFrame` loop calls `renderer.render()` or `composer.render()`.
- Resize handler updates camera aspect and renderer size.
