#!/usr/bin/env python3
"""
BookAI ADK Orchestrator - Minimal MVP Implementation
Provides intelligent routing for BookAI requests
"""

import os
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
from google.genai import types

# Configure logging (following existing pattern)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s]: %(message)s'
)
logger = logging.getLogger(__name__)

# Request/Response models
class RoutingRequest(BaseModel):
    user_message: str
    selected_model: str

class RoutingResponse(BaseModel):
    should_route: bool
    target_model: str
    reasoning: str
    confidence: float

class BookAIOrchestrator(Agent):
    """Minimal orchestrator for author creation detection"""
    
    def __init__(self):
        super().__init__(
            name="BookAI_Router",
            description="Routes author creation requests to specialized models",
            model="gemini-2.0-flash",
            instruction="""
            You are BookAI's request router. Your only job is to detect author creation requests.

            RULES:
            1. If the user wants to CREATE/GENERATE/MAKE an AUTHOR → respond exactly: "ROUTE_TO_AUTHORGEN"
            2. For any other request → respond exactly: "KEEP_CURRENT"

            Examples:
            - "Create horror author for Dark Writers" → "ROUTE_TO_AUTHORGEN" 
            - "Generate sci-fi author profile" → "ROUTE_TO_AUTHORGEN"
            - "Help me plan my book" → "KEEP_CURRENT"
            - "What's the weather?" → "KEEP_CURRENT"

            Be precise. Only route author creation requests to AuthorGen.
            """
        )

# Initialize FastAPI app
app = FastAPI(
    title="BookAI Orchestrator",
    description="Intelligent request routing for BookAI",
    version="1.0.0"
)

# Initialize orchestrator with Runner
try:
    agent = BookAIOrchestrator()
    session_service = InMemorySessionService()
    artifact_service = InMemoryArtifactService()
    
    # Create orchestrator runner
    orchestrator = Runner(
        app_name="BookAI-Orchestrator",
        agent=agent,
        session_service=session_service,
        artifact_service=artifact_service
    )
    
    logger.info("ADK Orchestrator with Runner initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize orchestrator: {e}")
    orchestrator = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not available")
    
    return {
        "status": "healthy",
        "service": "BookAI Orchestrator",
        "model": "gemini-2.0-flash-exp"
    }

@app.post("/route", response_model=RoutingResponse)
async def route_request(request: RoutingRequest) -> RoutingResponse:
    """
    Analyze request and provide routing decision
    """
    if orchestrator is None:
        logger.error("Orchestrator not available, falling back")
        return RoutingResponse(
            should_route=False,
            target_model=request.selected_model,
            reasoning="Orchestrator unavailable, using fallback",
            confidence=0.0
        )

    try:
        logger.info(f"Analyzing request: '{request.user_message}' (selected: {request.selected_model})")
        
        # Create a session for this routing request
        session = await orchestrator.session_service.create_session(
            state={},
            app_name="BookAI-Orchestrator",
            user_id="system"
        )
        
        # Create message content for ADK
        analysis_prompt = f"Analyze this request: {request.user_message}"
        content = types.Content(role='user', parts=[types.Part(text=analysis_prompt)])
        
        # Get routing decision from ADK runner
        events = orchestrator.run_async(
            session_id=session.id,
            user_id="system",
            new_message=content
        )
        
        # Collect response from events
        full_response = ""
        async for event in events:
            # Look for final response event
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text'):
                            full_response += part.text
                        else:
                            full_response += str(part)
                else:
                    full_response += str(event.content)
        
        # Parse response
        decision_text = full_response.strip().upper()
        
        if "ROUTE_TO_AUTHORGEN" in decision_text:
            should_route = True
            target_model = "AuthorGen"
            reasoning = "Author creation request detected"
            confidence = 0.9
        else:
            should_route = False
            target_model = request.selected_model
            reasoning = "Not an author creation request"
            confidence = 0.8

        logger.info(f"Routing decision: {target_model} (confidence: {confidence})")
        
        return RoutingResponse(
            should_route=should_route,
            target_model=target_model,
            reasoning=reasoning,
            confidence=confidence
        )

    except Exception as e:
        logger.error(f"Orchestrator error: {e}")
        
        # Graceful fallback
        return RoutingResponse(
            should_route=False,
            target_model=request.selected_model,
            reasoning=f"Error occurred, using fallback: {str(e)}",
            confidence=0.0
        )