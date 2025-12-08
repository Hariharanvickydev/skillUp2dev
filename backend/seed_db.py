"""
Database Seeding Script - Python Course with Content
Creates a complete Python course with topics and approved content
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models, auth
import uuid
from datetime import datetime

# Create tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    try:
        # 1. Create Admin User (if not exists)
        print("Checking admin user...")
        admin_user = db.query(models.User).filter(models.User.email == "admin@skillup2dev.com").first()
        if not admin_user:
            admin_user = models.User(
                email="admin@skillup2dev.com",
                password_hash=auth.hash_password("admin123"),
                full_name="Admin User",
                role="ADMIN"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Admin user created: {admin_user.email}")
        else:
            print(f"ℹ️  Admin user already exists: {admin_user.email}")
        
        # 2. Create Consumer User (if not exists)
        print("Checking consumer user...")
        consumer_user = db.query(models.User).filter(models.User.email == "student@skillup2dev.com").first()
        if not consumer_user:
            consumer_user = models.User(
                email="student@skillup2dev.com",
                password_hash=auth.hash_password("student123"),
                full_name="Student User",
                role="CONSUMER"
            )
            db.add(consumer_user)
            db.commit()
            db.refresh(consumer_user)
            print(f"✅ Consumer user created: {consumer_user.email}")
        else:
            print(f"ℹ️  Consumer user already exists: {consumer_user.email}")
        
        # 3. Create Python Course (if not exists)
        print("\nChecking Python course...")
        python_course = db.query(models.Course).filter(
            models.Course.title == "Python Programming Fundamentals"
        ).first()
        
        if not python_course:
            python_course = models.Course(
                title="Python Programming Fundamentals",
                description="Master Python from basics to advanced concepts. Learn variables, functions, OOP, and more.",
                status="PUBLISHED"
            )
            db.add(python_course)
            db.commit()
            db.refresh(python_course)
            print(f"✅ Course created: {python_course.title}")
        else:
            print(f"ℹ️  Course already exists: {python_course.title}")
        
        # 4. Create Topics with Content
        topics_data = [
            {
                "title": "Introduction to Python",
                "description": "Learn Python basics, syntax, and your first program",
                "content": """# Introduction to Python

## What is Python?

Python is a **high-level, interpreted programming language** known for its simplicity and readability. Created by Guido van Rossum in 1991, Python has become one of the most popular programming languages in the world.

## Why Learn Python?

- **Easy to Learn**: Clean and readable syntax
- **Versatile**: Web development, data science, AI, automation
- **Large Community**: Extensive libraries and support
- **High Demand**: Top skill in job market

## Your First Python Program

\`\`\`python
print("Hello, World!")
\`\`\`

This simple program outputs text to the console. The `print()` function is one of Python's built-in functions.

## Python Syntax Basics

### Variables
\`\`\`python
name = "Alice"
age = 25
height = 5.6
is_student = True
\`\`\`

### Comments
\`\`\`python
# This is a single-line comment

\"\"\"
This is a
multi-line comment
\"\"\"
\`\`\`

## Key Takeaways

✅ Python is beginner-friendly  
✅ No semicolons or curly braces required  
✅ Indentation matters in Python  
✅ Dynamic typing (no need to declare variable types)
"""
            },
            {
                "title": "Variables and Data Types",
                "description": "Understanding Python's core data types and variables",
                "content": """# Variables and Data Types

## Python Data Types

Python has several built-in data types:

### 1. Numeric Types

**Integers (int)**
\`\`\`python
age = 25
year = 2024
\`\`\`

**Floats (float)**
\`\`\`python
price = 19.99
temperature = 36.6
\`\`\`

### 2. Text Type

**Strings (str)**
\`\`\`python
name = "Alice"
message = 'Hello, World!'
multiline = \"\"\"This is a
multi-line string\"\"\"
\`\`\`

### 3. Boolean Type

**Boolean (bool)**
\`\`\`python
is_active = True
has_permission = False
\`\`\`

### 4. Collection Types

**Lists**
\`\`\`python
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]
\`\`\`

**Tuples** (immutable)
\`\`\`python
coordinates = (10, 20)
rgb = (255, 0, 0)
\`\`\`

**Dictionaries**
\`\`\`python
person = {
    "name": "Alice",
    "age": 25,
    "city": "New York"
}
\`\`\`

## Type Checking

\`\`\`python
x = 10
print(type(x))  # <class 'int'>

name = "Alice"
print(type(name))  # <class 'str'>
\`\`\`

## Type Conversion

\`\`\`python
# String to Integer
age = int("25")

# Integer to String
age_str = str(25)

# String to Float
price = float("19.99")
\`\`\`

## Key Takeaways

✅ Python is dynamically typed  
✅ Use `type()` to check data types  
✅ Convert between types using built-in functions  
✅ Choose the right data type for your needs
"""
            },
            {
                "title": "Control Flow - If Statements",
                "description": "Making decisions in your code with conditionals",
                "content": """# Control Flow - If Statements

## Basic If Statement

\`\`\`python
age = 18

if age >= 18:
    print("You are an adult")
\`\`\`

## If-Else Statement

\`\`\`python
temperature = 25

if temperature > 30:
    print("It's hot!")
else:
    print("It's comfortable")
\`\`\`

## If-Elif-Else Statement

\`\`\`python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Your grade is: {grade}")
\`\`\`

## Comparison Operators

| Operator | Meaning |
|----------|---------|
| `==` | Equal to |
| `!=` | Not equal to |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal to |
| `<=` | Less than or equal to |

## Logical Operators

**AND Operator**
\`\`\`python
age = 25
has_license = True

if age >= 18 and has_license:
    print("You can drive")
\`\`\`

**OR Operator**
\`\`\`python
day = "Saturday"

if day == "Saturday" or day == "Sunday":
    print("It's the weekend!")
\`\`\`

**NOT Operator**
\`\`\`python
is_raining = False

if not is_raining:
    print("Let's go outside!")
\`\`\`

## Nested If Statements

\`\`\`python
age = 25
has_ticket = True

if age >= 18:
    if has_ticket:
        print("Welcome to the concert!")
    else:
        print("You need a ticket")
else:
    print("You must be 18 or older")
\`\`\`

## Key Takeaways

✅ Use `if` for conditional logic  
✅ Indentation defines code blocks  
✅ Combine conditions with `and`, `or`, `not`  
✅ Use `elif` for multiple conditions
"""
            },
            {
                "title": "Loops - For and While",
                "description": "Repeating code with loops",
                "content": """# Loops - For and While

## For Loops

### Iterating Over a List

\`\`\`python
fruits = ["apple", "banana", "orange"]

for fruit in fruits:
    print(fruit)
\`\`\`

### Using range()

\`\`\`python
# Print numbers 0 to 4
for i in range(5):
    print(i)

# Print numbers 1 to 5
for i in range(1, 6):
    print(i)

# Print even numbers 0 to 10
for i in range(0, 11, 2):
    print(i)
\`\`\`

### Iterating Over a Dictionary

\`\`\`python
person = {"name": "Alice", "age": 25, "city": "NYC"}

# Iterate over keys
for key in person:
    print(key)

# Iterate over values
for value in person.values():
    print(value)

# Iterate over key-value pairs
for key, value in person.items():
    print(f"{key}: {value}")
\`\`\`

## While Loops

### Basic While Loop

\`\`\`python
count = 0

while count < 5:
    print(count)
    count += 1
\`\`\`

### While Loop with Condition

\`\`\`python
password = ""

while password != "secret":
    password = input("Enter password: ")

print("Access granted!")
\`\`\`

## Loop Control Statements

### Break Statement

\`\`\`python
for i in range(10):
    if i == 5:
        break
    print(i)
# Output: 0, 1, 2, 3, 4
\`\`\`

### Continue Statement

\`\`\`python
for i in range(5):
    if i == 2:
        continue
    print(i)
# Output: 0, 1, 3, 4
\`\`\`

### Else Clause in Loops

\`\`\`python
for i in range(5):
    print(i)
else:
    print("Loop completed!")
\`\`\`

## Nested Loops

\`\`\`python
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})")
\`\`\`

## Key Takeaways

✅ Use `for` loops for known iterations  
✅ Use `while` loops for conditional iterations  
✅ `break` exits the loop  
✅ `continue` skips to next iteration  
✅ `range()` generates number sequences
"""
            },
            {
                "title": "Functions",
                "description": "Creating reusable code with functions",
                "content": """# Functions

## Defining Functions

\`\`\`python
def greet():
    print("Hello, World!")

# Call the function
greet()
\`\`\`

## Functions with Parameters

\`\`\`python
def greet_person(name):
    print(f"Hello, {name}!")

greet_person("Alice")  # Output: Hello, Alice!
\`\`\`

## Multiple Parameters

\`\`\`python
def add_numbers(a, b):
    result = a + b
    print(f"{a} + {b} = {result}")

add_numbers(5, 3)  # Output: 5 + 3 = 8
\`\`\`

## Return Values

\`\`\`python
def multiply(a, b):
    return a * b

result = multiply(4, 5)
print(result)  # Output: 20
\`\`\`

## Default Parameters

\`\`\`python
def greet(name="Guest"):
    print(f"Hello, {name}!")

greet()  # Output: Hello, Guest!
greet("Alice")  # Output: Hello, Alice!
\`\`\`

## Keyword Arguments

\`\`\`python
def describe_person(name, age, city):
    print(f"{name} is {age} years old and lives in {city}")

describe_person(age=25, name="Alice", city="NYC")
\`\`\`

## Variable-Length Arguments

### *args (Tuple)

\`\`\`python
def sum_all(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(sum_all(1, 2, 3, 4, 5))  # Output: 15
\`\`\`

### **kwargs (Dictionary)

\`\`\`python
def print_info(**info):
    for key, value in info.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25, city="NYC")
\`\`\`

## Lambda Functions

\`\`\`python
# Regular function
def square(x):
    return x ** 2

# Lambda function
square = lambda x: x ** 2

print(square(5))  # Output: 25
\`\`\`

## Docstrings

\`\`\`python
def calculate_area(length, width):
    \"\"\"
    Calculate the area of a rectangle.
    
    Args:
        length: The length of the rectangle
        width: The width of the rectangle
    
    Returns:
        The area of the rectangle
    \"\"\"
    return length * width
\`\`\`

## Key Takeaways

✅ Functions make code reusable  
✅ Use `return` to send values back  
✅ Default parameters provide flexibility  
✅ `*args` and `**kwargs` handle variable arguments  
✅ Lambda functions for simple operations
"""
            }
        ]
        
        # 4. Create Topics with Content (if not exists)
        existing_topics = db.query(models.Topic).filter(
            models.Topic.course_id == python_course.id
        ).count()
        
        if existing_topics > 0:
            print(f"\nℹ️  Topics already exist for this course ({existing_topics} topics)")
        else:
            print("\nCreating topics and content...")
            
            # Create parent topic
            parent_topic = models.Topic(
                course_id=python_course.id,
                title="Python Fundamentals",
                description="Core Python programming concepts",
                order=1,
                status="APPROVED"
            )
            db.add(parent_topic)
            db.commit()
            db.refresh(parent_topic)
            print(f"  ✅ Parent Topic: {parent_topic.title}")
            
            # Create subtopics with content
            for idx, topic_data in enumerate(topics_data, 1):
                # Create subtopic
                topic = models.Topic(
                    course_id=python_course.id,
                    parent_topic_id=parent_topic.id,
                    title=topic_data["title"],
                    description=topic_data["description"],
                    order=idx,
                    status="APPROVED"
                )
                db.add(topic)
                db.commit()
                db.refresh(topic)
                
                # Create content
                content = models.TopicContent(
                    topic_id=topic.id,
                    content=topic_data["content"],
                    is_approved=True
                )
                db.add(content)
                db.commit()
                
                print(f"    ✅ Subtopic {idx}: {topic.title}")
        
        # Get final counts
        total_topics = db.query(models.Topic).filter(
            models.Topic.course_id == python_course.id
        ).count()
        
        print(f"\n🎉 Database seeding complete!")
        print(f"\n📚 Course: {python_course.title}")
        print(f"📝 Topics: {total_topics}")
        print(f"\n👤 Admin Login:")
        print(f"   Email: admin@skillup2dev.com")
        print(f"   Password: admin123")
        print(f"\n👤 Student Login:")
        print(f"   Email: student@skillup2dev.com")
        print(f"   Password: student123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding database with Python course...")
    print("=" * 50)
    seed_database()
