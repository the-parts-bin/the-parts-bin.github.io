---
layout: m20
title: "A 3D accelerator: perspective, light and depth at a pixel per clock"
description: "m20's 3D accelerator: it rasterizes polygons from their edges, maps textures with perspective, lights them from a lightmap and tests depth, at one pixel per clock; checked bit for bit against a C model, and used by four games with four different renderers."
date: 2026-11-09 09:02:00 +0100
series: m20
part: 3
permalink: /m20/3d-accelerator/
---

m20's 3D accelerator draws textured polygons. The CPU transforms the geometry and describes each face: its texture, its light, and the depth that carries the perspective. The accelerator does the per-pixel work: it walks the face's edges into rows (or takes the spans a renderer already has), maps the texture with perspective, lights each pixel from a lightmap, tests and writes depth, and writes RGB565 pixels into SDRAM at one per clock, while the CPU gets on with the rest of the frame. It began as Quake's inner loop in hardware; Quake, Tomb Raider, Descent and System Shock, four different renderers, all draw through it now. It's definitely not a full OpenGL / DirectX worthy accelerator, but it does its job.
{: .lede}

## What it draws

Underneath, every textured 3D renderer of the mid-90s does the same thing: it cuts each polygon into spans, horizontal runs of pixels, and steps the texture coordinates along them. Some walk a polygon's edges to find its rows; Quake sorts all the visible surfaces into spans first and hands those to `D_DrawSpans8`. Either way, for a flat face three quantities vary linearly across the screen: s/z and t/z (the texture coordinates divided by depth) and 1/z. Each is a plane, an origin plus a step per pixel in x and in y. A span's pixels need s and t themselves, which means a division per pixel. Quake divides every 8 pixels and steps linearly in between, which is close enough that nobody notices.

The accelerator takes its faces in exactly that form, the three planes, and divides every 16 pixels:

{% include m20/figure.html src="span-persp.svg" wide=true
   alt="The texture coordinate along a span: exact at every 16th pixel, linear in between, against the exact curve"
   caption="Along one span, the texture coordinate is exact at each dot and steps linearly between them. The error is a fraction of a texel." %}

The division is a pipeline of its own: leading zeros, a 1,025-entry reciprocal table with linear interpolation, a 32 × 18 multiply, a 64-bit shift, a clamp. Eight clocks deep, and a new operand every clock. While one 16-pixel segment's pixels stream out, the sequencer is already working out the next segment's ends, so a long span runs at a pixel per clock with no gaps.

## The pipeline

{% include m20/figure.html src="span-pipeline.svg" wide=true
   alt="The 3D accelerator's pipeline: CPU, FIFO, edge walk, span core, texel cache, palette and light, write buffers, SDRAM"
   caption="Everything runs on the CPU's 60 MHz clock; only the texel cache's fill port and the write-back register are on the SDRAM controller's 120 MHz side." %}

- **Commands** go through a 512-entry FIFO, as `{register, value}` pairs written to an I/O window. A surface is a few register writes (the three planes with their exponents, the texture, its extents), then its rows: one 32-bit word per span, `{count, v, u}`, up to 1024 pixels long, anywhere on a 1024 × 512 screen, or an EDGE command that has the accelerator make the rows itself. A register write waits until the pixels in flight are done, so a new surface can't overtake the old one's spans. The CPU only stalls if the FIFO is full.
- **The edge walk** sits at the FIFO's head. An EDGE command gives it a face's left and right edges, each an x and a step per row in 16.16 fixed point, a range of rows and a clip window. It turns each row into a span command, from whichever edge is further left to the other, clipped to the window, and slips it in ahead of the next FIFO entry, a row every few clocks, well ahead of the pixels. Only edges that change need sending: at a vertex partway down a polygon the CPU sends the one new edge, and the other carries on from where it got to. The CPU still does each polygon's setup, the edges' slopes and the face's planes; what it no longer does is anything per row, and a face of a hundred rows costs a handful of FIFO words instead of a hundred.
- **The span core** turns each span into a stream of texel addresses and 16-bit depths.
- **The texel cache** started at 2 KB, 32 lines of 64 bytes, direct-mapped; it's 8 KB now, 128 lines, with the index hashed by the tag's low bits so that a wide texture's rows don't all land on the same few lines. Each tag carries a 4-bit epoch, and a new texture just moves the epoch on, so the cache empties without clearing anything (a sweep resets the tags once every 15 textures). A miss fetches one line from SDRAM through the accelerator's own port on the controller.
- **The palette** is 256 RGB888 entries in block RAM (two banks of them now: Tomb Raider's underwater faces use the second). A lit texel's colour is multiplied by its brightness (three DSP multipliers) and packed into RGB565.
- **Write buffers**, two 64-byte lines each for the frame buffer and the z buffer, collect pixels and write them back as masked line writes when a span leaves the line (a mask bit per pixel: pixels and depths are only ever written whole). With the depth test on (below), the z buffer goes through a small z cache instead, which fetches the next span's lines while the current one draws. When the accelerator reports idle, every pixel is in SDRAM.

The accelerator runs on the CPU's clock. At the SDRAM's 120 MHz its control paths wouldn't close timing, and at 60 MHz it has all the speed it needs: a pixel per clock is already more than the SDRAM can take as reads and writes from everything else.

## Lighting: no surface cache

Quake's renderer doesn't light pixels as it draws them. It builds a *surface cache*: for each visible surface, a copy of its texture with the lightmap baked in, at the right mip level, and the span drawer reads from that. Building those surfaces on the CPU took a good share of the frame.

So the accelerator learned to light pixels itself, and it lights every game's faces the same way. In lit mode, the span reads the texture directly (power-of-two sizes, wrapping by mask) and takes the light from the surface's lightmap, which the accelerator loads into block RAM itself (up to 31 × 31 samples, 2<sup>k</sup> texels apart). The light is bilinear at each segment's ends and stepped linearly in between, like the texture coordinates. Then the palette's colour is multiplied by the brightness, where 128 means as-is and 256 is twice as bright. Colours 224 to 255 stay unlit: those are Quake's fullbright colours, the lamps and lava.

That's GL-style lighting rather than Quake's colormap, multiplying RGB instead of picking a darker palette entry. It looks slightly different from the original renderer, but it removes the surface cache's build entirely, and it made the frame RGB565 for free. The video engine doubles 16-bit lines horizontally the same way it does 8-bit ones.

## Verification: one C model, bit for bit

Before any RTL, the accelerator was a C model inside the Quake port: the same arithmetic in integers, the same segment lengths, the same rounding. Quake could draw with Quake's own drawers, with the model, or (later) with the accelerator, switched at run time. Getting the model right on screen first meant the RTL had a reference that was known to draw Quake correctly.

That C file became the hardware's specification. A test generator built on it produces random surfaces and spans (including the awkward ones: steep surfaces, spans past the old screen limits, lightmaps at the edges) and the RTL testbench compares every pixel: hundreds of thousands per seed, zero differences, with random backpressure on the output. A second test runs the whole SoC with the CPU drawing the same spans through the model and comparing them with the accelerator's output in SDRAM.

Later a second program grew on top of the model: an emulator of the whole accelerator at the register level, with the FIFO's commands, the lightmap loads, the edge walk, the depth test and its z cache. Each game's PC build can draw through it as if through the hardware, and be checked before it goes near a board; on recorded Tomb Raider frames and random command traces it matches the RTL bit for bit, depths included. What it can't show is timing: it finishes every command at once, so it's never busy (see below for why that matters).

The model caught two bugs in itself on the way. Its segment ends needed clamping so that stepping could never take s or t below zero (a read one byte before the texture), and the last segment's step needed rounding toward zero. Both would have been miserable to find in hardware.

## Making it fit

The first RTL version of the span core used 1,680 ALUs, which was too much even on the 20K. The fixes were the usual ones: one shared adder for all the multiply-adds, sequenced over the clocks the division takes anyway; a 32 × 11 multiplier instead of 32 × 32, since the other operand is a pixel position; cheaper rounding. It came down to 160 ALUs. The surface registers moved from flip-flops into a small LUT RAM with two read ports, which saved about 400 registers and 2 MHz of CPU clock.

Two of the block RAM rules from [part 2](../cpu/) applied here too: the palette and lightmap reads mustn't sit on the address being written, and every pipeline stage's value must hold in a stall (without the enables, 134 of 1,928 pixels came out with the wrong colour in simulation). And the request to the SDRAM controller needed its flop: before it, on some layouts, an accelerator write went to the wrong cache line, and Quake's data got silently overwritten.

The first full accelerator was about 4,300 logic cells and 10 block RAMs: the second biggest block on the chip, a bit more than half the CPU. It has grown since (below), to about 5,300 cells and 15 block RAMs, and to make room at 60 MHz it was trimmed again: a narrower clamp in the division, the lightmap blend in a DSP block, and one multiply-add for every texel offset, lit or not.

## What the other games added

The accelerator grew as the other games needed things:

- **Edges.** The edge walk (above) came from Tomb Raider, where it halved the FIFO words and took all the per-row work off the CPU. Descent and System Shock now hand their own mappers' rows over the same way, and Quake's models use it for every triangle.
- **A depth test**, with the z cache, and a skip for texel 0 (the see-through pixels), for Tomb Raider's faces and Quake's models.
- **Lit textures of any width.** Lit textures used to be powers of two, wrapping by mask, and Quake's model skins aren't. A width register now puts the rows any distance apart, through the same multiply-add as the unlit offsets, so the skins are read where Quake loaded them. Padding them to powers of two instead cost 0.7 MB, which pushed models out of Quake's cache.
- **One address stream for depth.** Part of the room for 60 MHz came from the depth buffer: inside the accelerator a depth goes by its pixel's frame address, and the depth buffer's offset from the frame is only added as a line leaves for SDRAM. So the depth buffer has to sit a multiple of 2 KB away from the frame, with the same stride, and a depth stride of zero means no depth writes at all.

## Using it from software

The accelerator writes SDRAM behind the CPU's back, so a program has to keep the data cache honest:

- **Before:** textures, lightmaps and anything else the accelerator reads must be written back from the cache (`cbo.clean`).
- **After:** any part of the frame the CPU might read or write must not be sitting in its cache with stale contents (`cbo.flush` before the accelerator writes there, or a wait for the accelerator before the CPU touches it).
- **Waiting** is a status register: the accelerator is busy until everything it was given is drawn and written back.
- **The buffer addresses only while it's idle.** The frame and depth base registers take effect at once. Quake once moved the frame base to the other display buffer while the accelerator was still writing back the last frame's model depths, which then went a display buffer away from the depth buffer, into Quake's own variables: traps in the client and sound code within minutes of play, and nothing in the emulator, which is never busy.

Counters for pixels drawn, texel cache misses and busy cycles make it easy to see whether the accelerator or the CPU is the limit, and in practice it's usually the CPU.

## What it did for Quake

<div class="table-wrap" markdown="1">

| Quake, timedemo demo1, 640 × 360, 60 MHz | fps |
|---|--:|
| the CPU, Quake's own span drawers and surface cache | 3.7 |
| the 3D accelerator | 15.0 |

</div>

Both are profile-guided builds, and three runs of each gave the same result to 0.1 fps. With the accelerator, it's busy about a quarter of the time: the rest of the frame is the CPU's, transforming, sorting edges into spans, and running the game.

The accelerator also draws Quake's models now, the monsters, items and the weapon: each triangle as three planes and a small lightmap that holds its Gouraud light, the rows through EDGE, depth-tested against the world.

## What its cache likes

The accelerator is as fast as its texels arrive, and the texel cache was small and simple: 2 KB, direct-mapped, 64-byte lines. It was designed for Quake's surface cache, which a span reads more or less along its rows. Other games read textures differently (measured with the 2 KB cache):

<div class="table-wrap" markdown="1">

| Game | Textures | Texel misses | Why |
|---|---|--:|---|
| Descent | 64 × 64, a row per cache line | under 1% | a whole row in each line; half the texture fits |
| OpenLara | 256 × 256 pages, rows 256 bytes apart | about 10% | 8 rows of a face's texture fit before they evict each other |
| System Shock | 128 × 128 on floors | up to 51% | when a texture's rows run across the screen, every scanline crosses more rows than the cache holds |

</div>

Since then the cache grew to 8 KB with a hashed index; textures read across their rows still miss 10 to 40%. It also used to write depth always, which only Quake needed then; now a depth stride of zero switches the writes off. A two-way cache is the obvious next change. In none of the games is the accelerator the bottleneck yet, though: it's busy 25 to 40% of the time, and the rest of each frame is the CPU's.

## One accelerator, four renderers

This accelerator started off as a very specific Quake inner loop accelerator. What made it general is that its interface is a set of primitives, not a game: a textured plane, a lightmap, a depth buffer, a polygon's edges or its spans. That's what every textured 3D renderer of the era does underneath, whatever it calls it. Quake's surfaces and models, Tomb Raider's faces, Descent's texture mapper and System Shock's wall and floor mappers all reduce to it, and each port drives the same accelerator with a few hundred lines of setup code. The ports also added primitives the others then used: the edge walk and the depth test came from Tomb Raider; Descent and System Shock now send their rows as edges, and Quake's models use both. [Part 4](../games/) is about those ports, and what it took to make games written for 8-bit screens share a 16-bit frame with it.
