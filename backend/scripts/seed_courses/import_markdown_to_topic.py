#!/usr/bin/env python3
"""
import_markdown_to_topic.py
---------------------------
Utility to import raw Markdown files into the GE3151 course topics.

Usage:
    python3 import_markdown_to_topic.py <markdown_folder>

The script expects each Markdown file to be named after the topic title,
with spaces replaced by underscores and a numeric prefix that matches the
topic order, e.g.:
    1_1_fundamentals_of_computing.md
    1_2_identification_of_computational_problems.md
    2_1_python_interpreter_and_interactive_mode.md

For each file the script:
  1. Derives the topic title by converting the filename back to a readable
     string (replacing underscores with spaces and capitalising the first
     letter of each word).
  2. Looks up the corresponding `Topic` record in the database (by title).
  3. Reads the raw Markdown content.
  4. Upserts a `TopicContent` row – creating it if missing or updating the
     existing one.
  5. Prints a concise summary of actions performed.
"""

import sys
import os
import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Helper to turn a filename like "1_1_fundamentals_of_computing.md"
# into the exact title stored in the DB: "1.1 Fundamentals of Computing"
# ---------------------------------------------------------------------------

def filename_to_title(fname: str) -> str:
    # Strip extension
    name = Path(fname).stem
    # Split on first underscore that separates the numeric prefix
    parts = name.split('_', 1)
    if len(parts) != 2:
        raise ValueError(f"Unexpected filename format: {fname}")
    prefix, rest = parts
    # Convert numeric prefix like "1_1" to "1.1"
    prefix = prefix.replace('_', '.')
    # Replace remaining underscores with spaces and title‑case each word
    title_words = rest.split('_')
    title = ' '.join(word.capitalize() for word in title_words)
    return f"{prefix} {title}"

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 import_markdown_to_topic.py <markdown_folder>")
        sys.exit(1)

    folder = Path(sys.argv[1]).resolve()
    if not folder.is_dir():
        print(f"❌ Folder does not exist: {folder}")
        sys.exit(1)

    # Add project root to sys.path so we can import the app models
    script_dir = Path(__file__).resolve().parent
    backend_dir = (script_dir / '..' / '..').resolve()
    sys.path.insert(0, str(backend_dir))

    from app import models, database
    from sqlalchemy.orm import sessionmaker

    Session = sessionmaker(bind=database.engine)
    db = Session()

    processed = 0
    created = 0
    updated = 0

    for md_file in folder.glob('*.md'):
        try:
            title = filename_to_title(md_file.name)
        except ValueError as e:
            print(f"⚠️  Skipping {md_file.name}: {e}")
            continue

        # Find the topic by title (exact match)
        topic = db.query(models.Topic).filter(models.Topic.title == title).first()
        if not topic:
            print(f"⚠️  No topic found for title '{title}' (file {md_file.name})")
            continue

        with md_file.open('r', encoding='utf-8') as f:
            markdown_content = f.read()

        # Upsert TopicContent
        tc = db.query(models.TopicContent).filter(models.TopicContent.topic_id == topic.id).first()
        if tc:
            tc.content = markdown_content
            action = "updated"
            updated += 1
        else:
            tc = models.TopicContent(topic_id=topic.id, content=markdown_content)
            db.add(tc)
            action = "created"
            created += 1
        db.commit()
        print(f"✅ {action.capitalize()} content for '{title}' (file {md_file.name})")
        processed += 1

    print("\nSummary:")
    print(f"  Processed files : {processed}")
    print(f"  Created records : {created}")
    print(f"  Updated records : {updated}")

if __name__ == "__main__":
    main()
