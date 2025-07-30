#!/usr/bin/env python3
"""
Debug ADK Agent initialization
"""

import os
import traceback
from google.adk.agents import Agent

# Print environment variables
print("Environment variables:")
for key in ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_GENAI_USE_VERTEXAI']:
    print(f"  {key}: {os.environ.get(key, 'NOT SET')}")

try:
    print("\nTrying to create Agent...")
    agent = Agent(
        name="test_agent",
        description="Test agent for debugging",
        model="gemini-2.0-flash"
    )
    print("✓ Agent created successfully")
    
    print("\nTesting run_async...")
    import asyncio
    
    async def test_run():
        try:
            response_stream = agent.run_async("Hello, respond with 'WORKING'")
            full_response = ""
            async for chunk in response_stream:
                if hasattr(chunk, 'content'):
                    full_response += chunk.content
                else:
                    full_response += str(chunk)
            print(f"✓ Response: {full_response}")
            return True
        except Exception as e:
            print(f"✗ run_async failed: {e}")
            traceback.print_exc()
            return False
    
    # Run async test
    result = asyncio.run(test_run())
    if result:
        print("✓ All tests passed!")
    else:
        print("✗ Tests failed")
        
except Exception as e:
    print(f"✗ Agent creation failed: {e}")
    traceback.print_exc()