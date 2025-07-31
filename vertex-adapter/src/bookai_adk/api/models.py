"""Pydantic models for OpenAI-compatible API."""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str  # "user", "assistant", "system"
    content: str


class ChatCompletionRequest(BaseModel):
    """Chat completion request model."""
    messages: List[ChatMessage]
    model: Optional[str] = "bookai-general"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    stop: Optional[Union[str, List[str]]] = None


class ChatCompletionChoice(BaseModel):
    """Chat completion choice model."""
    index: int
    message: ChatMessage
    finish_reason: str


class ChatCompletionResponse(BaseModel):
    """Chat completion response model."""
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: Dict[str, int]


class ChatCompletionChunk(BaseModel):
    """Chat completion streaming chunk model."""
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: List[Dict[str, Any]]


class ModelInfo(BaseModel):
    """Model information model."""
    id: str
    object: str = "model"
    created: int
    owned_by: str
    root: Optional[str] = None
    parent: Optional[str] = None


class ModelsResponse(BaseModel):
    """Models list response model."""
    object: str = "list"
    data: List[ModelInfo]