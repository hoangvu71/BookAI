"""Code domain agent."""

import time
from typing import Dict, Any
from bookai_adk.agents.base import BaseAgent


class CodeAgent(BaseAgent):
    """Agent specialized in coding questions and programming help."""
    
    def __init__(self):
        super().__init__(
            name="CodeAgent",
            description="Specialized agent for programming questions, code examples, and technical implementation"
        )
    
    async def process_query(self, query: str, context: Dict[str, Any] = None) -> str:
        """Process coding queries."""
        start_time = time.time()
        
        self.logger.info("Processing code query", query=query[:100])
        
        # Simulate processing time
        await self._simulate_processing()
        
        # Generate canned response based on query type
        response = self._generate_response(query)
        
        latency_ms = (time.time() - start_time) * 1000
        await self._log_interaction(query, response, latency_ms)
        
        return response
    
    async def _simulate_processing(self) -> None:
        """Simulate agent processing time."""
        import asyncio
        await asyncio.sleep(0.15)  # 150ms simulated processing
    
    def _generate_response(self, query: str) -> str:
        """Generate appropriate coding response."""
        query_lower = query.lower()
        
        if "python rest api" in query_lower or "rest api" in query_lower:
            return """Here's a simple Python REST API example using FastAPI:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="My API", version="1.0.0")

# Data model
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float

# In-memory storage (use database in production)
items = []
next_id = 1

# GET all items
@app.get("/items", response_model=List[Item])
async def get_items():
    return items

# GET single item
@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in items:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

# POST create item
@app.post("/items", response_model=Item)
async def create_item(item: Item):
    global next_id
    item.id = next_id
    next_id += 1
    items.append(item)
    return item

# Run with: uvicorn main:app --reload
```

Key features:
• Automatic OpenAPI/Swagger docs
• Type hints and validation with Pydantic
• Async support for better performance
• Built-in HTTP exception handling"""
        
        elif "function" in query_lower and "compound interest" in query_lower:
            return """Here's a compound interest calculation function:

```python
def calculate_compound_interest(
    principal: float,
    annual_rate: float,
    compounds_per_year: int = 12,
    years: float = 1.0
) -> dict:
    \"\"\"
    Calculate compound interest.
    
    Args:
        principal: Initial investment amount
        annual_rate: Annual interest rate (as decimal, e.g., 0.05 for 5%)
        compounds_per_year: How often interest compounds (12 = monthly)
        years: Investment period in years
    
    Returns:
        Dictionary with calculation results
    \"\"\"
    # A = P(1 + r/n)^(nt)
    amount = principal * (1 + annual_rate / compounds_per_year) ** (compounds_per_year * years)
    interest_earned = amount - principal
    
    return {
        "principal": principal,
        "final_amount": round(amount, 2),
        "interest_earned": round(interest_earned, 2),
        "effective_rate": round((amount / principal - 1) * 100, 2),
        "years": years,
        "compounds_per_year": compounds_per_year
    }

# Example usage:
result = calculate_compound_interest(
    principal=10000,      # $10,000 initial
    annual_rate=0.07,     # 7% annual rate
    compounds_per_year=12, # Monthly compounding
    years=5               # 5 years
)
print(f"${result['principal']:,} becomes ${result['final_amount']:,}")
print(f"Interest earned: ${result['interest_earned']:,}")
```

This handles monthly compounding by default but allows customization."""
        
        elif "algorithm" in query_lower or "sort" in query_lower:
            return """Here are common sorting algorithms in Python:

```python
def bubble_sort(arr):
    \"\"\"Simple but inefficient O(n²) sorting.\"\"\"
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(arr):
    \"\"\"Efficient O(n log n) average case sorting.\"\"\"
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

def merge_sort(arr):
    \"\"\"Stable O(n log n) sorting algorithm.\"\"\"
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Usage:
numbers = [64, 34, 25, 12, 22, 11, 90]
print("Quick sort:", quick_sort(numbers.copy()))
print("Merge sort:", merge_sort(numbers.copy()))
```

• Bubble sort: Simple, educational
• Quick sort: Fast average case
• Merge sort: Guaranteed O(n log n), stable"""
        
        else:
            return f"""I'm CodeAgent, specialized in programming and software development. Your query: "{query}"

I can help with:
• Python, JavaScript, Java, C++ code examples
• REST API design and implementation
• Algorithm explanations and implementations
• Database queries and design patterns
• Code optimization and best practices
• Framework-specific guidance (FastAPI, Django, React, etc.)
• Debugging and troubleshooting

Please ask specific programming questions and I'll provide detailed code examples!"""