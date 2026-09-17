# Lisboa Redemption

**Run-and-gun 2D** al estilo Metal Slug, ambientado en el Madrid cyberpunk de **2046**. Sátira futbolera + pastiche de Star Wars: Caminero Jr (kit del Atlético) debe recuperar la Champions robada de Lisboa frente a **Darth Floren** y sus agentes **Los Blancos**.

Hecho con **Phaser 3 + Vite + TypeScript**. Arte cómic / Metal Slug para Misión 1, key art de título, paneles cómic y audio WebAudio original (sin archivos con copyright).

## Requisitos

- Node.js 18+ y npm

## Cómo ejecutar

```bash
cd Lisboa-Redemption
npm install
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

### Build de producción

```bash
npm run build
npm run preview   # opcional: servir la carpeta dist/
```

## Controles

| Acción | Teclas |
|--------|--------|
| Mover | `←` `→` o `A` `D` |
| Saltar | `W` / `↑` / `Espacio` |
| Fuerza colchonera (Force blast) | `J` / `↓` / `Z` (mantener para disparo continuo) |
| Golpe Neptuno (especial) | `K` / `Shift` (medidor lleno) |
| Empezar desde el título | `Espacio` / `Enter` / clic |
| Saltar cinemáticas / crawl | `Espacio` / `Enter` / clic |
| Empezar misión | `Espacio` / `Enter` / botón **COMENZAR** |

## Escenas (vertical slice jugable)

1. **Title** — pantalla de título premium con key art cyberpunk (espectros de Futre, Jesús Gil, Antić, Luis Aragonés)
2. **Crawl** estilo Star Wars sobre fondo rojiblanco Atlético (saltabile)
3. **Cinemática de apertura** — secuencia cómic a pantalla completa (8 paneles), pesadilla del 93', rayo, foto del Cholo, radio “One way or another…” (motivo chiptune original)
4. **Briefing** — cómic full-bleed: Misión 1 / Llegar al tatuador **Pikolin**, objetivo, controles, botón **COMENZAR**
5. **Misión 1** — side-scroller Metal Slug (~4600 px), fuerza colchonera (Force waves), Golpe Neptuno, 3 vidas, Los Blancos (teletransporte / oleadas), obstáculos (cajas, escombros, gaps, plataformas móviles), HUD cómic, victoria en el taller de Pikolin
6. **Victoria / Game Over** con reintento

## Misión 1 — detalle

- **Assets** en `public/mission1/`: `briefing.png`, `player.png` / `player-sprite.png`, `enemy.png` / `enemy-sprite.png`, `bg.png`, `bg-rm.png` (preload: `m1-briefing`, `m1-player`, `m1-enemy`, `m1-bg`, `m1-bg-rm`)
- **Combate**: proyectiles de **fuerza colchonera** (energía rojiblanca estilo Force / Jedi), no balas genéricas; especial **Golpe Neptuno** con medidor por kills
- **Nivel**: dictadura Real Madrid / Bernabéu 2046 (fondo `bg-rm` con Florentino cyborg), parallax, neón parpadeante, drones, lluvia, toasts de oleada, screen shake y sparks
- **Dificultad**: media — más acción y enemigos agresivos, sin trampas injustas

## Roadmap (futuro)

- [ ] Misión 2: infiltración en el Museo del Real Madrid
- [ ] Boss: Darth Floren (gafas + capa)
- [ ] Más armas / power-ups colchoneros
- [ ] Localización EN
- [ ] Spritesheet animado y tileset dedicado
- [ ] Modo cooperativo 2P

## Estructura

```
src/
  main.ts
  scenes/     Boot, Title, Crawl, Cinematic, Briefing, Mission1, GameOver
  entities/   Player, Enemy, Bullet (Force blasts)
  utils/      Textures (procedural FX), AudioSynth, GameState
public/title/       keyart.png (fondo de título)
public/cinematic/   paneles cómic 01–08 + crawl-bg.png
public/mission1/    briefing, player, enemy, bg (+ sprites recortados)
scripts/            generate-cinematic-panels.mjs (opcional)
```

## Licencia / aviso

Proyecto fan / sátira. No afiliado a Atlético de Madrid, Real Madrid ni Lucasfilm. Audio generado por código (WebAudio); no se incluyen pistas comerciales.

---

*¡Aúpa Atleti! La fuerza colchonera te acompañe.*
