---
layout: post
title: Math Examples
date: 2025-03-18
categories: [tutorial, math]
---

# Math Support in Markdown

This page demonstrates how to use math expressions in Markdown.

## Inline Math

- Einstein's famous equation: $E = mc^2$
- The Pythagorean theorem: $a^2 + b^2 = c^2$
- A simple fraction: $\frac{1}{2}$

## Display Math

The quadratic formula:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

Maxwell's Equations:

$$
\begin{align}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} & = \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0
\end{align}
$$

A matrix:

$$
\begin{pmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{pmatrix}
$$

## Usage Instructions

You can write math expressions in your Markdown files using:

1. Inline math: `$...$` or `\(...\)`
2. Display math: `$$...$$` or `\[...\]`

For example, to write Einstein's equation inline, type `$E = mc^2$`.

For a block equation like the quadratic formula, use:

```
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```
