---
layout: kr260
title: "The XT: an 8088 with CGA and Hercules"
description: "The IBM PC/XT class machine: the MCL86 8088, the KFPC-XT chipset, CGA and Hercules cards, an XT-IDE hard disk, floppies and an AdLib."
date: 2026-11-25 09:00:00 +0100
series: kr260
part: 2
permalink: /kr260-pc/xt/
---

The first machine, and the one everything else grew from: an IBM PC/XT class computer with a 4.77 MHz 8088, 640 KB of RAM, CGA and Hercules cards, floppies, a hard disk and an AdLib. It's put together mostly from proven parts, so that the platform around it could be worked out first. If you need exact timing, use [the cycle-exact XT](../xt-exact/) instead.
{: .lede}

## The system

{% include kr260/figure.html src="xt.svg" wide=true
   alt="XT system diagram"
   caption="Dashed regions are clock domains; yellow boxes are memory." %}

Everything runs on one 57.27 MHz clock, four times the PC's 14.318 MHz crystal, with enables for the slower ones: the CGA's dot clock, the CPU's 4.77 MHz and the timer's 1.193 MHz. All memory fits in the FPGA's UltraRAM.

## Specs

<div class="table-wrap" markdown="1">

| | |
|---|---|
| CPU | 8088 (MCL86), 4.77 MHz, maximum mode |
| Memory | 640 KB |
| BIOS | GLaBIOS 0.4.2, XTIDE Universal BIOS r638 |
| Video | CGA (RGBI and composite colour), Hercules (720 × 348, two pages) |
| Sound | PC speaker, AdLib (OPL2) |
| Disks | two floppy drives (360K to 1.44M images), XT-IDE hard disk |
| Input | XT keyboard, Microsoft serial mouse on COM1 |

</div>

The switch block, set from Linux, picks the card on the monitor: CGA or Hercules. The composite output models a colour TV on the CGA's composite jack, so software that gets its colours that way works too.

## What we ran on it

- FreeDOS, from the hard disk and from a 360K floppy
- Borland's Turbo C++ 1.01 and other DOS development tools
- CuteMouse on the serial mouse
- 8088 MPH, which runs through with good music and recognisable effects, but not the right timing: that's the next machine's job

## Built from

<div class="table-wrap" markdown="1">

| Part | From | Licence | What we changed |
|---|---|---|---|
| CPU | MCL86 (Ted Fried, refactored by Marcus Andrade), via [PCXT_MiSTer](https://github.com/MiSTer-devel/PCXT_MiSTer) | MIT | unchanged |
| 8259, 8253, 8255, 8237 | KFPC-XT (kitune-san), via PCXT_MiSTer | MIT | 8253: the read-back command, and reads after a control word |
| Floppy controller | ao486 (Aleksander Osman), via PCXT_MiSTer | BSD | a sector past the end of track, as on a 765 |
| AdLib | [jtopl](https://github.com/jotego/jtopl) (Jose Tejada) | GPL-3.0 | unchanged |
| System BIOS | [GLaBIOS](https://github.com/640-KB/GLaBIOS) | GPL-3.0 | unchanged |
| Disk BIOS | [XTIDE Universal BIOS](https://www.xtideuniversalbios.org/) | GPL-2.0 | settings only |
| Character font | [DOSBox-X](https://github.com/joncampbell123/dosbox-x)'s BIOS tables | GPL-2.0 | extracted |

</div>

Ours: the CGA and Hercules cards, the composite decoder (from reenigne's model), the XT-IDE adapter and disk, the serial port and mouse, and the glue.
