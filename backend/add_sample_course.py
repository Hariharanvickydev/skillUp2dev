import sqlite3
from datetime import datetime
import uuid

# Connect to database
conn = sqlite3.connect('skillup2dev.db')
cursor = conn.cursor()

# Create a sample course
course_id = str(uuid.uuid4())
course_title = "React Fundamentals"
course_description = "Learn the basics of React including components, props, state, and hooks"

cursor.execute("""
    INSERT INTO courses (id, title, description, status, created_at, updated_at)
    VALUES (?, ?, ?, 'COMPLETED', ?, ?)
""", (course_id, course_title, course_description, datetime.utcnow(), datetime.utcnow()))

# Create Module 1
module1_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO topics (id, course_id, title, description, "order", status, created_at)
    VALUES (?, ?, ?, ?, 1, 'APPROVED', ?)
""", (module1_id, course_id, "Module 1: Introduction to React", 
      "Understanding React fundamentals and core concepts", 
      datetime.utcnow()))

# Create Topic 1.1
topic1_1_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO topics (id, course_id, title, description, "order", parent_topic_id, status, created_at)
    VALUES (?, ?, ?, ?, 1, ?, 'APPROVED', ?)
""", (topic1_1_id, course_id, "Topic 1.1: What is React?",
      "Introduction to React library and its ecosystem",
      module1_id, datetime.utcnow()))

# Add content for Topic 1.1
content1_1 = """# What is React?

React is a **JavaScript library** for building user interfaces, particularly single-page applications. It was developed by Facebook and is now maintained by Meta and a community of developers.

## Key Features

React has several powerful features that make it popular:

- **Component-Based**: Build encapsulated components that manage their own state
- **Declarative**: Design simple views for each state in your application
- **Learn Once, Write Anywhere**: Can be used for web, mobile (React Native), and desktop apps
- **Virtual DOM**: Efficient rendering with a virtual representation of the UI

## Why Use React?

| Feature | Benefit |
|---------|---------|
| Component Reusability | Write once, use everywhere |
| Virtual DOM | Fast and efficient updates |
| Large Ecosystem | Tons of libraries and tools |
| Strong Community | Easy to find help and resources |

## Simple Example

Here's a basic React component:

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Usage
<Welcome name="React Developer" />
```

## Key Takeaways

> React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

**Important concepts to remember:**
1. Components are the building blocks
2. Props pass data to components
3. State manages component data
4. JSX combines HTML with JavaScript
"""

cursor.execute("""
    INSERT INTO topic_contents (id, topic_id, content, is_approved, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
""", (str(uuid.uuid4()), topic1_1_id, content1_1, datetime.utcnow(), datetime.utcnow()))

# Create Topic 1.2
topic1_2_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO topics (id, course_id, title, description, "order", parent_topic_id, status, created_at)
    VALUES (?, ?, ?, ?, 2, ?, 'APPROVED', ?)
""", (topic1_2_id, course_id, "Topic 1.2: Setting Up React",
      "How to create and configure a React project",
      module1_id, datetime.utcnow()))

# Add content for Topic 1.2
content1_2 = """# Setting Up React

There are multiple ways to set up a React project. Let's explore the most common methods.

## Method 1: Create React App (Recommended for Beginners)

The easiest way to start a React project is using **Create React App**:

```bash
npx create-react-app my-app
cd my-app
npm start
```

This creates a new React project with:
- ✅ Modern build setup with no configuration
- ✅ Hot reloading for development
- ✅ Production-ready build scripts
- ✅ Testing framework included

## Method 2: Vite (Faster Alternative)

Vite is a modern, faster build tool:

```bash
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev
```

### Comparison: CRA vs Vite

| Feature | Create React App | Vite |
|---------|------------------|------|
| Build Speed | Slower | **Much Faster** |
| Dev Server | Slower startup | **Instant** |
| Hot Reload | Good | **Excellent** |
| Bundle Size | Larger | Smaller |
| Configuration | Zero-config | Minimal config |

## Project Structure

After creating your project, you'll see this structure:

```
my-app/
├── node_modules/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Your First Component

Edit `src/App.js`:

```jsx
function App() {
  return (
    <div className="App">
      <h1>Welcome to React!</h1>
      <p>Start building amazing apps!</p>
    </div>
  );
}

export default App;
```

## Running Your App

1. **Development mode**: `npm start` or `npm run dev`
2. **Production build**: `npm run build`
3. **Run tests**: `npm test`

> **Pro Tip**: Use React Developer Tools browser extension to debug your React applications easily!

## Next Steps

Now that you have React set up, you're ready to:
- Learn about **Components**
- Understand **Props and State**
- Explore **Hooks**
- Build your first app!
"""

cursor.execute("""
    INSERT INTO topic_contents (id, topic_id, content, is_approved, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
""", (str(uuid.uuid4()), topic1_2_id, content1_2, datetime.utcnow(), datetime.utcnow()))

# Commit and close
conn.commit()
conn.close()

print(f"✅ Created sample course: {course_title}")
print(f"   Course ID: {course_id}")
print(f"   - Module 1: Introduction to React")
print(f"     - Topic 1.1: What is React? (with content)")
print(f"     - Topic 1.2: Setting Up React (with content)")
print(f"   Status: COMPLETED (all topics approved)")
