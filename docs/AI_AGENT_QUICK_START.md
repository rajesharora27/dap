# AI Agent Quick Start Guide

**Last Updated:** December 3, 2025

## Overview

The DAP AI Agent allows you to ask natural language questions about your data instead of writing complex queries.

## Getting Started

### Access

1. Login to DAP as Admin (initially Admin-only)
2. Click on **AI Assistant** in the sidebar (or press `Cmd/Ctrl + K`)
3. Type your question and press Enter

### Example Questions

#### Products & Solutions

```
"Show me all products with tasks that have no telemetry"
"Which solutions have the most tasks?"
"Find tasks with weight = 0"
"List products without any assigned customers"
```

#### Customers & Adoption

```
"Show customers with adoption progress less than 50%"
"Which customers haven't started their adoption plan?"
"Show me the top 5 customers by adoption completion"
"Find customers with tasks stuck for more than 30 days"
```

#### Data Quality

```
"Find tasks with missing descriptions"
"Show telemetry attributes with no success criteria"
"List products with incomplete task definitions"
```

#### Analytics

```
"What's the average adoption rate across all customers?"
"Compare adoption rates between Essential and Advantage"
"Which products have the highest adoption success rate?"
```

## Response Format

The AI will respond with:
- **Natural language answer** explaining the results
- **Data table** when showing multiple records
- **Insights** highlighting patterns or issues
- **Follow-up suggestions** for related questions

## Tips for Better Results

1. **Be specific**: "Show customers with adoption below 50%" is better than "Show customers"
2. **Use entity names**: Reference Products, Solutions, Customers, Tasks, Telemetry
3. **Include thresholds**: "below 50%", "more than 30 days", "at least 10"
4. **Ask follow-ups**: Click suggestion chips or ask "Tell me more about X"

## Limitations

- Results limited to 100 rows in display
- Complex calculations may take up to 15 seconds
- Historical trends limited to available data
- You can only see data you have permission to access

## Common Issues

**"I don't have permission to access that data"**
- You can only query data your role allows (Admin=all, SME=products/solutions, CSS=customers)

**"I couldn't understand that question"**
- Try rephrasing with specific entity names
- Use example questions as templates

**"No results found"**
- The query was valid but no data matched
- Try broadening your criteria

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open AI Assistant |
| `Enter` | Submit question |
| `Escape` | Close panel |
| `↑` / `↓` | Navigate history |

## Getting Help

- Click the **?** icon in the AI panel for examples
- Check `/docs/AI_AGENT_FEATURE.md` for full documentation
- Report issues via the standard support channel

---

*See [AI Agent Feature Documentation](/docs/AI_AGENT_FEATURE.md) for complete technical details.*


