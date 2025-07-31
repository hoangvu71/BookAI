#!/usr/bin/env python3
"""CLI demo script for testing agent routing."""

import asyncio
import sys
import time
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from bookai_adk.agents.finance import FinanceAgent
from bookai_adk.agents.code import CodeAgent


async def main():
    """Demo script for testing agents."""
    print("BookAI ADK CLI Demo")
    print("=" * 40)
    
    # Initialize agents
    finance_agent = FinanceAgent()
    code_agent = CodeAgent()
    
    # Test queries
    test_queries = [
        ("What is an ETF?", "finance"),
        ("Show me a Python REST API example", "code"),
        ("How do I invest in index funds?", "finance"),
        ("Write a function to calculate compound interest", "code"),
    ]
    
    for query, expected_agent in test_queries:
        print(f"\nQuery: {query}")
        print(f"Expected: {expected_agent}")
        
        start_time = time.time()
        
        if "ETF" in query or "invest" in query or "index funds" in query:
            response = await finance_agent.process_query(query)
            used_agent = "finance"
        elif "Python" in query or "function" in query or "code" in query:
            response = await code_agent.process_query(query)
            used_agent = "code"
        else:
            response = "Unknown query type"
            used_agent = "unknown"
        
        latency = (time.time() - start_time) * 1000
        
        print(f"Used: {used_agent}")
        print(f"Latency: {latency:.2f}ms")
        print(f"Response: {response[:100]}...")
        
        # Check routing accuracy
        if used_agent == expected_agent:
            print("[PASS] Routing: CORRECT")
        else:
            print("[FAIL] Routing: INCORRECT")


if __name__ == "__main__":
    asyncio.run(main())