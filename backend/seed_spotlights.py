"""Seed spotlight entries into the database.

Run with: python seed_spotlights.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Spotlight


def seed_spotlights():
    db = SessionLocal()
    try:
        # Check if spotlights already exist
        existing = db.query(Spotlight).all()
        existing_titles = {s.title for s in existing}

        spotlight_data = [
            Spotlight(title="Raf", description="Former student, Summit #1 singles & GTW teacher brings his daughters to develop their strokes.", image_path="", is_adult=True, sort_order=1),
            Spotlight(title="Wendy", description="Former #1 singles in Chatham & GTW teacher loves bringing in her daughter and seeing her play on the Chatham team.", image_path="", is_adult=True, sort_order=2),
            Spotlight(title="Monica", description="Former #1 doubles Newark Academy. We now work with her son to make Summit Varsity.", image_path="", is_adult=True, sort_order=3),
            Spotlight(title="Dana", description="Former #1 singles in New Providence was frustrated with clubs/pro's for her daughter in her area. She's happy to travel to GTW for her daughter.", image_path="", is_adult=True, sort_order=4),
            Spotlight(title="Chris", description="Former #1 singles at New Providence & GTW teacher moved out of NJ. When visiting NJ he brings his daughter in for lessons.", image_path="", is_adult=True, sort_order=5),
            Spotlight(title="Andy", description="Played #2 singles New Providence. Andy's parents took him to lessons 30 years ago, now they take their grandson to GTW.", image_path="", is_adult=True, sort_order=6),
            Spotlight(title="Anaya", description="Governor Livingston 1st Doubles Player — student and assistant teacher at GTW.", image_path="", is_adult=False, sort_order=7),
        ]

        added = 0
        for entry in spotlight_data:
            if entry.title not in existing_titles:
                db.add(entry)
                added += 1
                print(f"  ✅ Added: {entry.title}")
            else:
                print(f"  ⏭️  Already exists: {entry.title}")

        db.commit()
        print(f"\n✅ Done! Added {added} new spotlight entries.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding spotlight entries...")
    seed_spotlights()