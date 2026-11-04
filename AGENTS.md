<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game architecture
- Keep the flight simulation in a browser-independent module and drive it from R3F with clamped delta time; this makes gameplay rules testable without WebGL.
- Use bespoke lathed and extruded geometry for the fictional reference-specific rocket; generic stock spacecraft cannot faithfully preserve its silhouette.
- Mount the game on the client-only index route, with DOM menus above an always-mounted Canvas; WebGL must not run during SSR and pausing must preserve the round.
- Define UI and scene palette roles in the global design system; shared scene colors are read from its CSS variables after mounting.
- AI-generated mission specs go through a server function and must pass `validateMission` clamping before they reach the simulation; never feed raw model output into flight rules.
