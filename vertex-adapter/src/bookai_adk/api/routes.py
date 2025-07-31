"""API routes for BookAI ADK service."""

import json
import time
import uuid
from typing import AsyncGenerator, Dict, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import structlog

from bookai_adk.api.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionChoice,
    ChatMessage,
    ModelsResponse,
    ModelInfo
)
from bookai_adk.core.orchestrator import AgentOrchestrator

router = APIRouter()
logger = structlog.get_logger().bind(component="api")

# Global orchestrator instance
orchestrator = AgentOrchestrator()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "bookai-adk"}


@router.get("/v1/models", response_model=ModelsResponse)
async def list_models():
    """List available models (agents)."""
    models_data = orchestrator.get_available_models()
    return ModelsResponse(**models_data)


@router.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """Handle chat completion requests with optional streaming."""
    try:
        # Extract the user's message
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages cannot be empty")
        
        user_message = request.messages[-1].content
        request_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
        created_time = int(time.time())
        
        logger.info(
            "Chat completion request",
            request_id=request_id,
            model=request.model,
            stream=request.stream,
            message_length=len(user_message)
        )
        
        if request.stream:
            # Streaming response
            return StreamingResponse(
                stream_chat_response(request_id, user_message, request.model, created_time, {"model": request.model}),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        else:
            # Non-streaming response
            response_content = await orchestrator.process_query(
                query=user_message,
                user_id=request_id,
                context={"model": request.model}
            )
            
            return ChatCompletionResponse(
                id=request_id,
                created=created_time,
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0,
                        message=ChatMessage(role="assistant", content=response_content),
                        finish_reason="stop"
                    )
                ],
                usage={
                    "prompt_tokens": len(user_message.split()),
                    "completion_tokens": len(response_content.split()),
                    "total_tokens": len(user_message.split()) + len(response_content.split())
                }
            )
    
    except Exception as e:
        logger.error("Chat completion error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def stream_chat_response(
    request_id: str, 
    user_message: str, 
    model: str,
    created_time: int,
    context: Dict[str, Any] = None
) -> AsyncGenerator[str, None]:
    """Generate streaming chat completion response in OpenAI format."""
    try:
        # Stream response chunks
        async for chunk in orchestrator.process_query_stream(
            query=user_message,
            user_id=request_id,
            context=context
        ):
            # Format as OpenAI streaming chunk
            chunk_data = {
                "id": request_id,
                "object": "chat.completion.chunk",
                "created": created_time,
                "model": model,
                "choices": [{
                    "index": 0,
                    "delta": {"content": chunk},
                    "finish_reason": None
                }]
            }
            
            yield f"data: {json.dumps(chunk_data)}\n\n"
        
        # Send final chunk
        final_chunk = {
            "id": request_id,
            "object": "chat.completion.chunk",
            "created": created_time,
            "model": model,
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop"
            }]
        }
        
        yield f"data: {json.dumps(final_chunk)}\n\n"
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error("Streaming error", error=str(e))
        error_chunk = {
            "id": request_id,
            "object": "chat.completion.chunk",
            "created": created_time,
            "model": model,
            "choices": [{
                "index": 0,
                "delta": {"content": f"Error: {str(e)}"},
                "finish_reason": "error"
            }]
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"