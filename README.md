# 🌌 NOVA Break

A lightweight, non-blocking break reminder for people who hate intrusive Pomodoro apps.

Instead of popping up alerts or freezing your screen, Blackhole Break shows a small animated black hole inside your active tab after a work session. You can ignore it and keep working, but it slowly grows over time as a gentle reminder to take a break.

---

## Why I built this

Most break apps interrupt you right when you're in flow. I wanted something that felt less like an alarm and more like a background reminder.

The idea is simple: don’t block the user—just visually suggest a break.

---

## Features

 **Non-blocking UI** — uses `pointer-events: none` so it never interferes with clicks or typing
 **Growing reminder** — the black hole slowly increases in size if you ignore it
 **CSS-based animation** — layered effects to simulate a swirling space distortion
 **Lightweight extension** — runs directly in the browser tab

---

## How it works

The extension tracks active time in the browser. When a session limit is reached, it injects a visual component into the page.

The black hole effect is built using multiple CSS layers (blur, gradients, rotation, and scaling). The hardest part was tuning the animation so it looks smooth without slowing down normal webpages.

---

## Future ideas

* subtle sound effects when the black hole grows
* text distortion near the center
* customizable timers and themes

---

## Note

This is a personal project and still evolving. The goal is to make break reminders feel less annoying and more aesthetic.
