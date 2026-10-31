# ADR 004: QR Code Generation Tooling

## Status
Accepted

## Context
The user requested a single consolidated file containing all source code and a scannable QR code to access and download the code file during the hackathon exhibition.

## Decision
Installed `qrcode` (v8.2) pinned with `pillow` to generate high-density, error-correcting QR codes that link directly to the local network endpoint (`http://128.0.88.136:3000/code`) and GitHub repository.

## Consequences
Enables instant scanning by judges and attendees with smartphones without external cloud dependencies.
