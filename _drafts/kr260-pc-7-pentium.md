---
layout: kr260
title: "The Pentium-class PC: PCI, an S3 Trio64V+ and a Voodoo"
description: "The Pentium-class machine: z486 with Pentium additions at 100 MHz, a 430HX/PIIX3 PCI board, an S3 Trio64V+ with 4 MB and a 3dfx Voodoo Graphics, running Windows 98."
date: 2026-11-25 09:00:00 +0100
series: kr260
part: 7
permalink: /kr260-pc/pentium/
---

The biggest machine of the lot: a PCI board with a 430HX chipset, an S3 Trio64V+, a 3dfx Voodoo Graphics, and 64 MB of RAM, running Windows 98 SE. Its CPU is z486 at 100 MHz with Pentium additions.
{: .lede}

## The system

{% include kr260/figure.html src="pentium.svg" wide=true
   alt="Pentium-class PC system diagram"
   caption="Guest RAM, the Voodoo's memory and the S3's beyond 1 MB are in DDR." %}

## Specs

<div class="table-wrap" markdown="1">

| | |
|---|---|
| CPU | z486 with CPUID, RDTSC, the MSRs and a pipelined x87, at 100.2 MHz; no MMX, no CMPXCHG8B |
| Caches | 16 KB instruction, 16 KB data; 128 KB second level |
| Memory | 64 MB |
| Chipset | Intel 430HX host bridge, PIIX3 |
| BIOS | SeaBIOS |
| Video | S3 Trio64V+, 4 MB, with its 2D engine |
| 3D | 3dfx Voodoo Graphics, 8 MB frame buffer, one texture unit with 4 MB |
| Sound | Sound Blaster 16, OPL3 |
| Disks | floppies, IDE disks, ATAPI CD-ROM |
| Other | NE2000, bridged to the network; PS/2 mouse |

</div>

It uses 93% of the chip's lookup tables and 97% of its block RAM, and takes about an hour to build.

## What we ran on it

- Windows 98 SE, with the stock S3 and Sound Blaster drivers; Windows 95 on the S3
- Doom, at 30 fps in its timed demo at 100 MHz (an earlier build)
- Second Reality and Unreal
- the Glide SDK's test programs, and 3dfx's Demo Room (21 fps on an earlier build)
- POD, on the Voodoo

## Known issues

- The S3's video overlay isn't there yet, so video players that use it show a black picture.
- Disks are PIO only, without bus-master DMA.
- POD with sound is slow in a race.

## Built from

<div class="table-wrap" markdown="1">

| Part | From | Licence | What we changed |
|---|---|---|---|
| CPU | [z486](https://github.com/nand2mario/z486) (nand2mario) | Apache-2.0; Intel's microcode, not redistributed | see below |
| Voodoo | [zSST](https://github.com/nand2mario/zSST), and the memory bridge of [z486 XL](https://github.com/nand2mario/z486_XL) (nand2mario) | Apache-2.0 | see below |
| BIOS | [SeaBIOS](https://github.com/coreboot/seabios) | LGPL-3.0 | 430HX support, a PnP entry for the PCI bus, disk translation |
| S3 reference | [86Box](https://github.com/86Box/86Box)'s vid_s3 | GPL-2.0 | reference only |
| OPL3 and chips | as on the [486](../486/) | | |
| Vendor BIOS | S3 Trio64V+ (Phoenix), from [86Box's ROM collection](https://github.com/86Box/roms) | vendor, not redistributed | – |

</div>

Ours: the chipset, the S3 Trio64V+ with its graphics engine, the Voodoo's PCI and display side, and everything the 486 already had.

## What we changed

**z486.** The Pentium instructions software checks for, and most of the work went into the x87: a renamed register stack, where FXCH costs nothing, a pipelined adder and multiplier, and a divider next to it. Results are checked against the 486 build on long random instruction chains.

**zSST.** The linear frame buffer follows the displayed buffer, the texture unit keeps its own W, a deeper command FIFO, gathered texture writes, and buffer swaps that hold later commands back.
