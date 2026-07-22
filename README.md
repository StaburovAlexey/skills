# My Agent Skills

[![skills.sh](https://skills.sh/b/StaburovAlexey/skills)](https://skills.sh/StaburovAlexey/skills)

A collection of reusable AI agent skills for Vue, TypeScript, 3D rendering, and full-stack development.

## Install

```bash
# Install a specific skill
npx skills add StaburovAlexey/skills@vue-flow-best-practices
npx skills add StaburovAlexey/skills@threejs
npx skills add StaburovAlexey/skills@yandex-games-release-audit

# Install all skills from this repo
npx skills add StaburovAlexey/skills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [vue-flow-best-practices](./skills/vue-flow-best-practices/SKILL.md) | Build and maintain Vue Flow graph editors in Vue 3 with TypeScript |
| [threejs](./skills/threejs/SKILL.md) | Comprehensive Three.js 3D rendering — scene setup, geometry, materials, lighting, animation, post-processing, shaders |
| [yandex-games-release-audit](./skills/yandex-games-release-audit/SKILL.md) | Audit, repair, verify, and package browser games for Yandex Games |

## Structure

```
skills/
├── vue-flow-best-practices/    # Vue Flow editor patterns
│   ├── SKILL.md
│   ├── agents/
│   └── references/
├── threejs/                    # Three.js 3D rendering
│   ├── SKILL.md                # Overview + navigation (100 lines)
│   ├── agents/
│   └── references/             # 10 deep-dive topic files (~5k lines total)
│       ├── fundamentals.md     # Scene, cameras, renderer, math
│       ├── geometry.md         # Shapes, BufferGeometry, instancing
│       ├── materials.md        # PBR, Phong, physical, toon
│       ├── lighting.md         # Lights, shadows, IBL
│       ├── textures.md         # Texture loading, UV, env maps
│       ├── loaders.md          # GLTF, OBJ, async patterns
│       ├── animation.md        # Keyframe, skeletal, morph, blending
│       ├── interaction.md      # Raycasting, controls, input
│       ├── postprocessing.md   # Bloom, DOF, SSAO, custom passes
│       └── shaders.md          # GLSL, ShaderMaterial, custom effects
└── yandex-games-release-audit/ # Yandex Games release preparation
    ├── SKILL.md
    ├── agents/
    ├── references/
    └── scripts/
```

## License

MIT
