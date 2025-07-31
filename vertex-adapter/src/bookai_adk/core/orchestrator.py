"""Agent orchestrator for routing queries to appropriate agents."""

import time
import uuid
import structlog
from pathlib import Path
from typing import Dict, Any, AsyncGenerator, Optional

from bookai_adk.agents.finance import FinanceAgent
from bookai_adk.agents.code import CodeAgent
from bookai_adk.core.logging import log_agent_interaction
from bookai_adk.core.vertex_llm_router import VertexLLMRouter


class AgentOrchestrator:
    """Orchestrates requests between different specialized agents."""
    
    def __init__(self):
        self.logger = structlog.get_logger().bind(component="orchestrator")
        
        # Initialize available agents
        self.agents: Dict[str, Any] = {
            "finance": FinanceAgent(),
            "code": CodeAgent(),
        }
        
        # Initialize LLM router for intelligent routing
        self.llm_router = VertexLLMRouter()
        
        # Simple routing patterns
        self.routing_patterns = {
            "finance": [
                "etf", "invest", "investment", "stock", "bond", "portfolio",
                "index fund", "mutual fund", "401k", "ira", "retirement",
                "dividend", "compound interest", "savings", "budget"
            ],
            "code": [
                "python", "javascript", "java", "code", "function", "api",
                "algorithm", "programming", "software", "debug", "framework",
                "database", "sql", "rest", "web development", "class"
            ]
        }
        
        self.logger.info("Agent orchestrator initialized", agents=list(self.agents.keys()))
    
    def route_query(self, query: str) -> str:
        """Determine which agent should handle the query (legacy method)."""
        query_lower = query.lower()
        
        # Check finance patterns
        for pattern in self.routing_patterns["finance"]:
            if pattern in query_lower:
                return "finance"
        
        # Check code patterns
        for pattern in self.routing_patterns["code"]:
            if pattern in query_lower:
                return "code"
        
        # Default to finance for general queries
        return "finance"
    
    async def route_query_intelligent(self, query: str) -> Dict[str, Any]:
        """Use LLM router for intelligent query analysis and routing."""
        return await self.llm_router.analyze_query(query)
    
    async def process_query(
        self, 
        query: str, 
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Process a query through the appropriate agent with intelligent routing."""
        start_time = time.time()
        
        # Ensure context is a dictionary
        if context is None:
            context = {}
        elif isinstance(context, str):
            context = {"model": context}
        
        # Check if a specific model/agent was requested
        requested_model = context.get("model", "")
        if requested_model == "finance-agent":
            agent_name = "finance"
            routing_method = "explicit"
            routing_analysis = None
        elif requested_model == "code-agent":
            agent_name = "code"
            routing_method = "explicit"
            routing_analysis = None
        else:
            # Use intelligent LLM routing
            routing_analysis = await self.route_query_intelligent(query)
            agent_name = routing_analysis["primary_agent"]
            routing_method = "intelligent"
        
        # Handle multi-domain queries if LLM routing detected them
        if routing_analysis and routing_analysis.get("is_multi_domain", False):
            self.logger.info(
                "Multi-domain query detected",
                query=query[:100],
                primary_agent=agent_name,
                secondary_agents=routing_analysis.get("secondary_agents", []),
                confidence=routing_analysis.get("confidence", 0),
                user_id=user_id
            )
            
            # Use LLM router's multi-domain handling
            response = await self.llm_router.route_multi_domain_query(
                query, routing_analysis, self.agents
            )
        else:
            # Single domain - route to primary agent
            agent = self.agents[agent_name]
            
            self.logger.info(
                "Routing query",
                query=query[:100],
                agent=agent_name,
                routing_method=routing_method,
                confidence=routing_analysis.get("confidence", 1.0) if routing_analysis else 1.0,
                requested_model=requested_model,
                user_id=user_id
            )
            
            # Process through selected agent
            response = await agent.process_query(query, context)
        
        # Log metrics
        latency_ms = (time.time() - start_time) * 1000
        log_agent_interaction(
            user_id=user_id or "anonymous",
            agent_name=agent_name,
            latency_ms=latency_ms
        )
        
        return response
    
    async def process_query_stream(
        self,
        query: str,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """Process a query and stream the response in chunks."""
        # For now, simulate streaming by chunking the complete response
        response = await self.process_query(query, user_id, context)
        
        # Split response into words for streaming simulation
        words = response.split()
        chunk_size = 5  # words per chunk
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            if i + chunk_size < len(words):
                chunk += " "
            
            yield chunk
            
            # Small delay to simulate real streaming
            import asyncio
            await asyncio.sleep(0.05)
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get list of available agent models."""
        return {
            "object": "list",
            "data": [
                {
                    "id": "bookai-general",
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "bookai",
                    "description": "General BookAI orchestrator with agent routing"
                },
                {
                    "id": "finance-agent",
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "bookai",
                    "description": "Specialized financial advisor agent"
                },
                {
                    "id": "code-agent", 
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "bookai",
                    "description": "Specialized programming and coding agent"
                }
            ]
        }