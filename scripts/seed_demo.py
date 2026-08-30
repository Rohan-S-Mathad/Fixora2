import asyncio
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.db.init_db import seed_demo_data


async def main():
    print("Running Fixora Demo Seeder...")
    await seed_demo_data()
    print("Demo seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())
