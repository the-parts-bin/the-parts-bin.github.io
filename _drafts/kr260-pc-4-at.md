---
layout: kr260
title: "The AT: an 80286 with an EGA"
description: "The IBM PC/AT class machine: SPK286 at 8 MHz on a 5170-style board, with an EGA, 16-bit ISA, IDE, and a Sound Blaster Pro."
date: 2026-11-25 09:00:00 +0100
series: kr260
part: 4
permalink: /kr260-pc/at/
---

An IBM 5170 class machine: an 80286 at 8 MHz, 16-bit ISA, IDE, an EGA and IBM's own BIOS. Its board is also the base of the 386, the 486 and the Pentium-class machine.
{: .lede}

## The system

{% include kr260/figure.html src="at.svg" wide=true
   alt="AT system diagram"
   caption="The AT board: two interrupt controllers, two DMA controllers, the keyboard controller, the clock and CMOS RAM, behind 16-bit ISA." %}

The IBM BIOS won't run on anything faster than 8 MHz: it measures the CPU against the refresh timer and stops when they disagree. That makes the timing matter here too. SPK286 charges each instruction its documented clocks, and the bus charges its wait states.

## Specs

<div class="table-wrap" markdown="1">

| | |
|---|---|
| CPU | 80286 (SPK286), 8 MHz, real and protected mode, no 80287 |
| Memory | 640 KB + 1 MB in UltraRAM, more in DDR, up to about 15 MB (2 MB fitted by default) |
| BIOS | IBM 5170, 11/15/85 |
| Video | EGA, 256 KB, IBM's EGA BIOS |
| Sound | Sound Blaster Pro with AdLib (OPL2), PC speaker |
| Disks | floppies, IDE hard disk |
| Other | NE2000 network card, Microsoft serial mouse, real-time clock |

</div>

IBM's BIOS tests all the memory at each cold boot, at about 0.6 seconds per 64 KB, hence the modest default.

## What we ran on it

{% comment %} The EGA bitstream is new: confirm these on it before publishing. {% endcomment %}

- FreeDOS and MS-DOS
- Windows 3.0 in standard mode
- Sound Blaster Pro tests

## How exact is it?

SPK286's clocks per instruction, checked against hardware captures over 200 cases per opcode, come to 0.94 of the hardware's on average, with 42% of the cases within two clocks. Jumps run 6 to 10 clocks fast, some string instructions slow: close, but not exact.

## Built from

<div class="table-wrap" markdown="1">

| Part | From | Licence | What we changed |
|---|---|---|---|
| CPU | [SPK286](https://github.com/spark2k06/SPK286) (Aitor Gomez Garcia) | MIT | unchanged, its timing profile on |
| PIC, timer, DMA | KFPC-XT (kitune-san) | MIT | as on the XT |
| Floppy controller | ao486, via PCXT_MiSTer | BSD | as on the XT |
| AdLib | [jtopl](https://github.com/jotego/jtopl) | GPL-3.0 | unchanged |
| EGA reference | [MartyPC](https://github.com/dbalsom/martypc) (Daniel Balsom) | MIT | – |
| Vendor BIOSes | IBM 5170, IBM EGA, from [86Box's ROM collection](https://github.com/86Box/roms) | vendor, not redistributed | – |

</div>

Ours: the AT board, the keyboard controller, the clock, the EGA, the Sound Blaster Pro, the NE2000 and the IDE port.
