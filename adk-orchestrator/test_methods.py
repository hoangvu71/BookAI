#!/usr/bin/env python3
"""
Quick test to discover ADK Agent methods
"""

from google.adk.agents import Agent

# Create a simple agent
agent = Agent(
    name="test_agent",
    description="Test agent to discover methods",
    model="gemini-2.0-flash-exp"
)

# Print all available methods
print("Available methods:")
methods = [method for method in dir(agent) if not method.startswith('_')]
for method in sorted(methods):
    print(f"  - {method}")

# Check if specific methods exist
test_methods = ['run', 'invoke', 'execute', 'call', 'process', '__call__']
print("\nChecking specific methods:")
for method in test_methods:
    exists = hasattr(agent, method)
    print(f"  {method}: {'✓' if exists else '✗'}")