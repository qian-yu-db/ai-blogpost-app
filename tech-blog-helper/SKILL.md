---
name: tech-blog-helper
description: Create technical blog post outlines and drafts, and review final versions. Use when users want to write technical blog posts with topics, objectives, target audience, and code examples. Handles outline creation, drafting in markdown, and final review. Trigger phrases include "create a blog post", "draft a technical article", "write about [technology]", "blog outline for", "review my blog post".
---

# Tech Blog Helper

Create high-quality technical blog post outlines, drafts, and reviews. This skill helps transform technical topics and code examples into engaging blog content, then reviews final versions for technical accuracy, clarity, and audience appropriateness.

## Workflow Overview

The blog creation process follows these phases:

1. **Gather requirements** - Collect topic, objectives, audience, and code references
2. **Create outline** - Structure the post with logical flow and key sections
3. **Draft the post** - Write comprehensive markdown content with code examples
4. **Review final version** - Evaluate technical accuracy, clarity, and polish

## Phase 1: Gather Requirements

When a user requests blog post help, collect these inputs:

**Required:**
- Main topic and objectives
- Target audience (skill level, background)

**Optional but recommended:**
- GitHub repository URLs or code example files
- Specific technical points to emphasize
- Desired post length (short/medium/long)
- Tone preference (formal, conversational, tutorial-style)

If GitHub repos are mentioned, use web_fetch to examine relevant files, READMEs, and code structure.

## Phase 2: Create Outline

Generate a structured outline following the template in `references/blog_outline_template.md`. The outline should:

- Start with a compelling hook that addresses audience pain points
- Include clear section headings with brief descriptions
- Identify where code examples fit naturally
- Plan transitions between concepts
- End with actionable takeaways

Present the outline to the user for feedback before proceeding to drafting.

## Phase 3: Draft the Blog Post

Write the full blog post in markdown format following these guidelines:

### Structure
- **Title**: Clear, specific, includes key technology/concept
- **Introduction**: Hook + context + what readers will learn
- **Body sections**: 3-6 main sections with clear headings
- **Code examples**: Syntax-highlighted, well-commented, progressively complex
- **Conclusion**: Summary + next steps or further reading

### Writing Style
- Match the target audience's technical level
- Use concrete examples before abstractions
- Explain "why" not just "how"
- Break complex ideas into digestible chunks
- Use analogies for difficult concepts

### Code Integration
- Introduce code with context (what problem it solves)
- Use real, runnable examples from provided repos
- Add inline comments for non-obvious logic
- Show both "before" and "after" when demonstrating improvements
- Include error handling and edge cases for production-quality examples

### Technical Accuracy
- Verify technical claims against documentation
- Include version numbers for libraries/frameworks
- Mention important caveats or limitations
- Link to official documentation

See `references/blog_writing_guidelines.md` for detailed writing best practices.

## Phase 4: Review Final Version

When the user provides their final version for review, evaluate across these dimensions:

### Technical Accuracy
- Verify code examples are correct and follow best practices
- Check for outdated patterns or deprecated APIs
- Ensure technical terminology is used correctly
- Validate that examples work as described

### Clarity & Structure
- Assess logical flow and transitions
- Identify confusing explanations
- Check if concepts build progressively
- Evaluate if the introduction sets proper expectations

### Audience Fit
- Verify appropriate complexity level
- Check if jargon is explained
- Assess if prerequisites are stated
- Evaluate pacing for target audience

### Polish
- Identify typos and grammatical issues
- Check code formatting consistency
- Verify all links work
- Ensure consistent voice and tone

Provide specific, actionable feedback organized by section with:
- What works well
- What needs improvement
- Concrete suggestions for changes

## Tips for Success

- **Start simple**: For complex topics, create outline first, get feedback, then draft
- **Use real code**: Prefer actual working examples from repos over pseudocode
- **Test examples**: If possible, verify code examples actually run
- **Iterate**: Expect multiple rounds of outline/draft/review cycles
- **Be specific**: Generic feedback like "make it clearer" is less helpful than "explain what a closure is before using it in line 23"
