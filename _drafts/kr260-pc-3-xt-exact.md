---
layout: kr260
title: "The cycle-exact XT: Intel's microcode and a CGA to match"
description: "An XT whose 8088 runs Intel's microcode and matches hardware captures cycle for cycle, with the chipset and CGA timing to go with it, running 8088 MPH and Area 5150."
date: 2026-11-25 09:00:00 +0100
series: kr260
part: 3
permalink: /kr260-pc/xt-exact/
---

8088 MPH and Area 5150 don't just run on an XT, they depend on when every bus cycle, refresh and character clock happens. This machine has its own 8088, running Intel's original microcode, and a chipset and CGA written to the same standard.
{: .lede}

## The system

{% include kr260/figure.html src="xt-exact.svg" wide=true
   alt="Cycle-exact XT system diagram"
   caption="The layout is the XT's; the CPU, the chipset and the CGA are the parts that differ." %}

The CPU gets 12 machine clocks for each of its own 4.77 MHz clocks, and uses them as a short fixed sequence of steps: bus unit, queue, microcode, instruction loader, next bus cycle. That order is the reference emulator's order, which made the port checkable step by step.

## Specs

<div class="table-wrap" markdown="1">

| | |
|---|---|
| CPU | 8088, 4.77 MHz, running Intel's microcode (512 × 21 bits) |
| Memory | 640 KB, with refresh taking bus time |
| BIOS | GLaBIOS 0.4.2, XTIDE Universal BIOS r638 |
| Video | CGA with its character clock, wait states and status timing; composite colour |
| Sound | PC speaker, AdLib (OPL2) |
| Disks | floppies, XT-IDE hard disk |
| Input | XT keyboard, serial mouse |

</div>

## How it was checked

- **Single instructions.** The whole SingleStepTests 8088 v2 suite, captured from hardware, passes cycle for cycle: 2,977,000 tests.
- **Against the reference.** The CPU ran in lockstep with XTCE-Blue for 300 million clocks (a minute of XT time) without a difference, and the whole machine through its power-on self test.
- **8088 MPH.** 180 seconds of the demo, more than half, ran with every CPU bus cycle and the CGA's state equal to XTCE-Blue's.
- **The synthesised netlist.** Vivado's version of the CPU runs the same tests, which caught a ROM it had synthesised wrong: the design worked in simulation but didn't boot on the board.

## What we ran on it

- 8088 MPH, including its 1K-colour composite modes
- Area 5150
- FreeDOS and DOS programs

## Built from

<div class="table-wrap" markdown="1">

| Part | From | Licence | What we changed |
|---|---|---|---|
| 8088 reference | [XTCE-Blue](https://github.com/dbalsom/XTCE-Blue) (Andrew Jenner, Daniel Balsom) | MIT | an external floppy controller and a settable memory size, for the comparisons |
| Microcode transcription | XTCE-Blue and [reenigne](https://github.com/reenigne/reenigne) | Intel's contents, not redistributed | – |
| Floppy controller | ao486, via PCXT_MiSTer | BSD | as on the XT |
| AdLib, BIOSes, font | as on [the XT](../xt/) | | |

</div>

Ours, ported from XTCE-Blue's models: the 8088, the 8253, 8259, 8255 and 8237, and the CGA. The CGA's status register timing comes from the IBM schematic, which Area 5150's elephant scene needed.
