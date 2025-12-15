# SkillUp2Dev V2: Branding & Identity Plan

To evolve "SkillUp2Dev" into a premium SaaS experience, we need a cohesive brand identity.

## 1. Brand Philosophy
**Visual Aesthetic**: Future-facing, Professional, High-Contrast.
**Keywords**: Growth, Technical Mastery, Speed, Structure.

## 2. Color Palette (Dark Mode First)
We will focus on a "Dark Mode" aesthetic common in developer tools (like Vercel, Linear, Supabase).

| Color Name | Token Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Obsidian** | `bg-primary` | `#0A0A0B` | Main background. Deep, almost black. |
| **Grid Grey** | `bg-secondary` | `#18181B` | Card backgrounds, panels. |
| **Neon Electric** | `accent-primary`| `#00E599` | Primary actions (Buttons, Links). A vibrant tech green. |
| **Cyber Blue** | `accent-secondary`| `#3B82F6` | Secondary actions, info highlights. |
| **Starlight** | `text-primary` | `#FFFFFF` | Main headings. |
| **Mist** | `text-secondary` | `#A1A1AA` | Body text, subtitles. |

## 3. Typography
**Font Family**: `Inter` (Google Fonts) or `Geist Mono` (for code).
- **Headings**: Bold, Tight tracking.
- **Body**: Clean, high readability.

## 4. Brand Name & Logo Options

**Selected Name: LeAIzy**

*   **Concept**: "Learning made Lazy (Easy) with AI". Smart, efficient, effortless mastery.
*   **Vibe**: Clever, Gen-Z friendly, Tech-forward.
*   **Tagline**: "Smart Learning for Lazy Geniuses."

**Logo Concept**:
**Icon**: A stylized sloth or a reclining figure wearing VR specs / connected to nodes.
**Style**: Neon, Relaxed but Futuristic.

## 5. UI Components
- **Glassmorphism**: Subtle transluscent backgrounds for headers/modals (`backdrop-blur`).
- **Borders**: Thin, subtle borders (`border-white/10`).
- **Gradients**: Soft glow effects behind hero sections.

## 6. Implementation Plan
1.  **Tailwind Config**: Update `tailwind.config.ts` with these precise colors.
2.  **Global CSS**: Set default background and text colors.
3.  **Component System**: Create reusable `Button`, `Card`, `Badge` components using these tokens.
