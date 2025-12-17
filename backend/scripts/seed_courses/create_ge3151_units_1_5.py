"""
GE3151 - Seeder for Units I‑V (first five units)
================================================
Creates the GE3151 course with the first five units as per the updated syllabus.
All topics are created in DRAFT status so that content can be generated later.
"""

import sys, os
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, '..', '..')
sys.path.insert(0, backend_dir)

from app import models, database
from sqlalchemy import text


def create_course(db):
    """Create GE3151 course with Units I‑V."""
    course = models.Course(
        title="GE3151 Problem Solving and Python Programming",
        description="Course covering computational thinking, data types, control flow, and advanced Python topics – first five units of Anna University GE3151 (Regulation 2021).",
        is_library_course=True,
        organization_id=None,
        category="Computer Science",
        tags=["Python", "Computational Thinking", "Algorithms", "Anna University", "GE3151"],
        difficulty="Beginner",
        outcomes=[
            "Understand basics of algorithmic problem solving",
            "Solve problems using Python conditionals and loops",
            "Define and use Python functions",
            "Use Python data structures (lists, tuples, dictionaries)",
            "Perform file I/O in Python"
        ],
        settings={
            "duration": "45 hours",
            "credits": "3",
            "code": "GE3151",
            "ltp": "3-0-0",
            "regulation": "2021",
            "semester": "I",
            "references": [
                "Allen B. Downey, Think Python: How to Think like a Computer Scientist, 2nd Edition, O'Reilly 2016",
                "Karl Beecher, Computational Thinking: A Beginner's Guide to Problem Solving and Programming, 1st Edition, BCS Learning & Development 2017",
                "Paul Deitel and Harvey Deitel, Python for Programmers, Pearson 2021",
                "G Venkatesh and Madhavan Mukund, Computational Thinking: A Primer for Programmers and Data Scientists, Notion Press 2021",
                "John V. Guttag, Introduction to Computation and Programming Using Python, MIT Press 2021",
                "Eric Matthes, Python Crash Course, 2nd Edition, No Starch Press 2019",
                "https://www.python.org/",
                "Martin C. Brown, Python: The Complete Reference, 4th Edition, McGraw Hill 2018"
            ]
        }
    )
    db.add(course)
    db.flush()
    print(f"✅ Course created: {course.title}\n")

    modules = [
        {
            "title": "UNIT I: Computational Thinking and Problem Solving",
            "description": "Fundamentals of Computing – Identification of Computational Problems – Algorithms and building blocks – notation – algorithmic problem solving – simple strategies (iteration, recursion).",
            "topics": [
                {"title": "1.1 Fundamentals of Computing", "description": "Basic concepts of computing and problem identification."},
                {"title": "1.2 Identification of Computational Problems", "description": "How to recognise problems that can be solved computationally."},
                {"title": "1.3 Algorithms", "description": "Definition, characteristics, and design steps of algorithms."},
                {"title": "1.4 Algorithm Building Blocks", "description": "Statements, state, control flow, functions."},
                {"title": "1.5 Algorithm Representation", "description": "Pseudo‑code, flow‑chart, programming language mapping."},
                {"title": "1.6 Algorithmic Problem‑Solving Techniques", "description": "Iteration, recursion, step‑wise refinement."},
                {"title": "1.7 Illustrative Problems", "description": "Find minimum, insert into sorted list, guess integer, Towers of Hanoi."}
            ]
        },
        {
            "title": "UNIT II: Data Types, Expressions, Statements",
            "description": "Python interpreter, debugging, data types, variables, expressions, statements, tuple assignment, operator precedence, comments.",
            "topics": [
                {"title": "2.1 Python Interpreter & Interactive Mode", "description": "Running Python code, debugging basics."},
                {"title": "2.2 Data Types", "description": "int, float, boolean, string, list."},
                {"title": "2.3 Variables & Expressions", "description": "Variable naming, tuple assignment, operator precedence."},
                {"title": "2.4 Statements & Comments", "description": "Statement structure, commenting code."},
                {"title": "2.5 Illustrative Programs", "description": "Swap values, circulate n variables, distance between points."}
            ]
        },
        {
            "title": "UNIT III: Control Flow, Functions, Strings",
            "description": "Conditionals, iteration, functions, string handling, and list usage as arrays.",
            "topics": [
                {"title": "3.1 Conditionals", "description": "Boolean values, if, if‑else, if‑elif‑else."},
                {"title": "3.2 Iteration", "description": "while, for, break, continue, pass."},
                {"title": "3.3 Functions", "description": "Definition, parameters, return values, scope, composition, recursion."},
                {"title": "3.4 Strings", "description": "Slices, immutability, functions, methods, string module."},
                {"title": "3.5 Illustrative Programs", "description": "Square root, GCD, exponentiation, sum of array, linear & binary search."}
            ]
        },
        {
            "title": "UNIT IV: Lists, Tuples, Dictionaries",
            "description": "Lists: operations, slices, methods, loops, mutability, aliasing, cloning, parameters. Tuples: assignment, return values. Dictionaries: operations and methods. Advanced list processing – list comprehensions.",
            "topics": [
                {"title": "4.1 List Operations", "description": "Append, extend, insert, remove, pop, clear, index, count, sort, reverse."},
                {"title": "4.2 List Slices & Methods", "description": "Slicing syntax, common methods like .append(), .extend(), .pop(), .remove()."},
                {"title": "4.3 List Loops & Mutability", "description": "Iterating over lists, in‑place modifications, aliasing pitfalls."},
                {"title": "4.4 List Cloning & Parameters", "description": "Copying lists via slice, list(), copy module, passing lists to functions."},
                {"title": "4.5 Tuple Assignment & Return", "description": "Multiple assignment, using tuples as return values."},
                {"title": "4.6 Dictionary Operations", "description": "Create, access, update, delete, keys(), values(), items()."},
                {"title": "4.7 List Comprehensions", "description": "Compact syntax for generating lists, filtering, mapping."},
                {"title": "4.8 Illustrative Programs", "description": "Simple sorting, histogram generation, student marks statement, retail bill preparation."}
            ]
        },
        {
            "title": "UNIT V: Files, Modules, Packages",
            "description": "File I/O, format operator, command‑line arguments, error handling, exceptions, modules and packages.",
            "topics": [
                {"title": "5.1 Text Files & Format Operator", "description": "Reading/writing files, using f‑strings and % formatting."},
                {"title": "5.2 Command Line Arguments", "description": "Using sys.argv and argparse for CLI programs."},
                {"title": "5.3 Errors & Exceptions", "description": "Try/except blocks, custom exceptions, finally clause."},
                {"title": "5.4 Modules & Packages", "description": "Creating reusable modules, __init__.py, package structure."},
                {"title": "5.5 Illustrative Programs", "description": "Word count, copy file, voter age validation, marks range validation (0‑100)."}
            ]
        }
    ]

    total_topics = 0
    for order, mod in enumerate(modules, 1):
        module = models.Topic(
            course_id=course.id,
            title=mod["title"],
            description=mod["description"],
            order=order,
            status="DRAFT",
            is_published=False,
            parent_topic_id=None
        )
        db.add(module)
        db.flush()
        print(f"  ✅ {module.title}")
        for t_order, t in enumerate(mod["topics"], 1):
            topic = models.Topic(
                course_id=course.id,
                title=t["title"],
                description=t["description"],
                order=t_order,
                status="DRAFT",
                is_published=False,
                parent_topic_id=module.id
            )
            db.add(topic)
            db.flush()
            print(f"     ✓ {topic.title}")
            total_topics += 1
    print(f"\n✅ Created: 5 Units, {total_topics} Topics, 45 Hours\n")
    return course


def main():
    print("=" * 80)
    print("GE3151 – Seeder for Units I‑V (first five units)")
    print("=" * 80)
    db = next(database.get_db())
    try:
        existing = db.query(models.Course).filter(models.Course.title.contains("GE3151")).first()
        if existing:
            print("⚠️  GE3151 course already exists. Deleting it first.")
            cid = existing.id
            db.execute(text("DELETE FROM topic_contents WHERE topic_id IN (SELECT id FROM topics WHERE course_id = :cid)"), {"cid": cid})
            db.execute(text("UPDATE topics SET parent_topic_id = NULL WHERE course_id = :cid"), {"cid": cid})
            db.execute(text("DELETE FROM topics WHERE course_id = :cid"), {"cid": cid})
            db.execute(text("DELETE FROM courses WHERE id = :cid"), {"cid": cid})
            db.commit()
            print("✅ Old GE3151 course removed.")
        course = create_course(db)
        db.commit()
        print("=" * 80)
        print(f"✅ SUCCESS! Course ID: {course.id}")
        print("=" * 80)
    except Exception as e:
        db.rollback()
        print("❌ ERROR:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
