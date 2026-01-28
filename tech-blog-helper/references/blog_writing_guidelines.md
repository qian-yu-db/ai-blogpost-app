# Technical Blog Writing Guidelines

## Writing Style Principles

### Match Audience Technical Level

**Beginner audience:**
- Define technical terms on first use
- Use analogies to familiar concepts
- Provide more context and explanation
- Include links to foundational resources
- Example: "Think of a Promise like ordering food at a restaurant..."

**Intermediate audience:**
- Assume knowledge of fundamentals
- Focus on practical patterns and tradeoffs
- Explain "why" behind decisions
- Compare alternative approaches
- Example: "Unlike callbacks, Promises provide better error handling..."

**Advanced audience:**
- Discuss performance implications
- Compare implementation details
- Reference source code or RFCs
- Explore edge cases and optimizations
- Example: "The V8 engine optimizes this pattern through inline caching..."

### Clarity Best Practices

**Use concrete before abstract:**
```markdown
❌ Abstract first: "Middleware functions have access to request/response objects"
✅ Concrete first: "When a user visits /api/users, Express runs your middleware:
   function(req, res, next) { ... }"
```

**Show, then explain:**
```markdown
❌ Explain then show: "React hooks allow functional components to manage state..."
✅ Show then explain: 
   const [count, setCount] = useState(0);
   // useState is a React hook that lets functional components manage state
```

**Break complex ideas into chunks:**
```markdown
❌ One dense paragraph: "Distributed tracing works by..."
✅ Multiple focused paragraphs:
   First, let's understand the problem...
   
   To solve this, distributed tracing uses...
   
   Here's how it works in practice...
```

## Code Example Best Practices

### Progressive Complexity

Structure examples to build understanding:

1. **Minimal example**: Show core concept only
2. **Practical example**: Add real-world context
3. **Production example**: Include error handling, edge cases

```markdown
**Basic usage:**
```python
result = client.query("SELECT * FROM users")
```

**With error handling:**
```python
try:
    result = client.query("SELECT * FROM users")
    return result.to_dataframe()
except QueryError as e:
    logger.error(f"Query failed: {e}")
    return None
```

**Production-ready:**
```python
def fetch_users(
    client: DataClient,
    max_retries: int = 3
) -> Optional[pd.DataFrame]:
    """Fetch users with retry logic and proper error handling."""
    for attempt in range(max_retries):
        try:
            result = client.query(
                "SELECT * FROM users WHERE active = true"
            )
            return result.to_dataframe()
        except QueryError as e:
            if attempt == max_retries - 1:
                logger.error(f"Query failed after {max_retries} attempts: {e}")
                return None
            time.sleep(2 ** attempt)  # Exponential backoff
```
```

### Code Comments

**What to comment:**
- Non-obvious logic or algorithms
- Workarounds for known issues
- Performance-critical sections
- Edge case handling

**What not to comment:**
- Obvious operations (❌ `count += 1  # Increment count`)
- Self-explanatory function names
- Standard library usage

**Good commenting examples:**
```python
# Use binary search since items are sorted by timestamp
index = bisect.bisect_left(timestamps, target_time)

# Workaround for SQLite's limited datetime support
# See: https://github.com/project/issues/123
date_str = date.strftime("%Y-%m-%d %H:%M:%S")
```

### Syntax Highlighting

Always specify the language for code blocks:

```markdown
✅ Good:
```python
def hello():
    print("Hello")
```

❌ Bad:
```
def hello():
    print("Hello")
```
```

Common language identifiers:
- `python`, `javascript`, `typescript`, `java`, `go`
- `bash`, `shell`, `sql`, `json`, `yaml`
- `dockerfile`, `nginx`, `makefile`

## Technical Accuracy

### Version Specificity

Always include version information for libraries and frameworks:

```markdown
❌ Vague: "React hooks were added recently"
✅ Specific: "React hooks were introduced in React 16.8 (February 2019)"

❌ Incomplete: "Install TensorFlow"
✅ Complete: "Install TensorFlow 2.15: pip install tensorflow==2.15.0"
```

### Caveats and Limitations

Be upfront about limitations:

```markdown
**Note**: This approach works well for datasets under 1GB. For larger datasets,
consider using Dask or Spark for distributed processing.

**Warning**: The experimental feature flag must be enabled:
spark.conf.set("spark.sql.experimental.feature", "true")
This may change in future versions.

**Browser support**: This CSS feature requires Safari 16+ or Chrome 90+.
Check [caniuse.com](https://caniuse.com/feature) for current support.
```

### Link to Documentation

Provide official documentation links:

```markdown
For more details on the MLflow Model Registry, see the 
[official documentation](https://mlflow.org/docs/latest/model-registry.html).

This follows the OpenAPI 3.0 specification 
([spec](https://spec.openapis.org/oas/v3.0.0)).
```

## Structure and Flow

### Section Headers

Use descriptive, scannable headers:

```markdown
❌ Generic: "Step 1", "Implementation", "Part 2"
✅ Descriptive: "Setting Up the Environment", "Implementing OAuth Flow", 
                "Optimizing Query Performance"
```

### Transitions

Connect sections with transitional phrases:

```markdown
Now that we understand the basics, let's implement this in production...

With the foundation in place, we can tackle the more advanced scenario...

This naive approach works, but we can optimize it further...
```

### Paragraph Structure

- **One idea per paragraph**: Don't mix concepts
- **First sentence = topic sentence**: State the main point upfront
- **3-5 sentences ideal**: Break up longer paragraphs
- **Use whitespace**: Don't wall-of-text readers

## Common Pitfalls to Avoid

### Avoid assumptions without stating them

```markdown
❌ "Simply run the following command..."
✅ "After installing Docker, run the following command..."
```

### Don't skip error handling in examples

```markdown
❌ Only showing the happy path
✅ Show common errors and how to handle them
```

### Avoid outdated patterns

```markdown
❌ `var` in JavaScript examples (outdated)
✅ `const`/`let` in JavaScript examples (current)

❌ Class components in React (older style)
✅ Functional components with hooks (current best practice)
```

### Don't use fake/incomplete examples

```markdown
❌ def process_data():
       # TODO: implement this
       pass

✅ def process_data(df: pd.DataFrame) -> pd.DataFrame:
       """Remove null values and normalize columns."""
       return df.dropna().apply(normalize_column)
```

## Review Checklist

Before finalizing, check:

- [ ] All code examples are syntactically correct
- [ ] Technical terms defined on first use
- [ ] Version numbers included for dependencies
- [ ] Links to official documentation provided
- [ ] Caveats and limitations mentioned
- [ ] Code progresses from simple to complex
- [ ] Examples include error handling
- [ ] Headers are descriptive and scannable
- [ ] Transitions connect sections logically
- [ ] Tone matches target audience level
