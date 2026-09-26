# Grammie

A local AI writing companion that fixes grammar, explains mistakes, and helps transform rough thoughts into polished words.

## Features

- Check grammar, spelling, punctuation, and sentence structure
- Generate a corrected version of the user's writing
- Show Before → After corrections
- Explain why each correction was made
- Provide an overall explanation of the writing
- Simple and user-friendly web interface
- Runs AI processing locally using QVAC
- No external AI API required
- No cloud-based AI processing required

## Tech Stack

- Node.js
- JavaScript
- HTML
- CSS
- QVAC SDK

## QVAC SDK Version

This project uses:

`@qvac/sdk` version `0.20.0`

## How It Works

Grammie follows a simple writing-assistance workflow:

1. The user enters or pastes their writing.
2. Grammie sends the text to the local QVAC AI model.
3. The AI checks the writing for grammar, spelling, punctuation, and sentence structure.
4. Grammie generates a corrected version.
5. Grammie displays the detected changes using a Before → After format.
6. Grammie explains why the corrections were made.

## Installation

Clone the repository:

```bash
git clone https://github.com/chimayzz/Grammie.git