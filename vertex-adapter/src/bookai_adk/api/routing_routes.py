"""API routes for routing information and testing."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import structlog

from bookai_adk.api.routes import orchestrator

routing_router = APIRouter(prefix="/routing", tags=["routing"])
logger = structlog.get_logger().bind(component="routing-api")


class QueryAnalysisRequest(BaseModel):
    """Request model for query analysis."""
    query: str


class QueryAnalysisResponse(BaseModel):
    """Response model for query analysis."""
    query: str
    analysis: Dict[str, Any]
    routing_stats: Dict[str, Any]


@routing_router.post("/analyze", response_model=QueryAnalysisResponse)
async def analyze_query(request: QueryAnalysisRequest):
    """Analyze a query and return routing decision without processing it."""
    try:
        # Get routing analysis
        analysis = await orchestrator.route_query_intelligent(request.query)
        
        # Get routing stats
        routing_stats = orchestrator.llm_router.get_routing_stats()
        
        logger.info("Query analysis requested", 
                   query=request.query[:100],
                   primary_agent=analysis["primary_agent"])
        
        return QueryAnalysisResponse(
            query=request.query,
            analysis=analysis,
            routing_stats=routing_stats
        )
        
    except Exception as e:
        logger.error("Query analysis failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@routing_router.get("/stats")
async def get_routing_stats():
    """Get routing system statistics and configuration."""
    try:
        routing_stats = orchestrator.llm_router.get_routing_stats()
        
        return {
            "routing_system": routing_stats,
            "available_agents": list(orchestrator.agents.keys()),
            "agent_descriptions": orchestrator.llm_router.get_agent_descriptions()
        }
        
    except Exception as e:
        logger.error("Failed to get routing stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@routing_router.get("/test")
async def test_routing_examples():
    """Test routing with example queries to demonstrate capabilities."""
    test_queries = [
        "What is an ETF and how do I invest in one?",
        "How do I build a REST API with FastAPI?",
        "Create a Python script to analyze my stock portfolio",
        "Explain compound interest and show me the calculation",
        "Debug this JavaScript function that's not working",
        "What's the best investment strategy for retirement?",
        "How do I deploy a web application to the cloud?"
    ]
    
    results = []
    for query in test_queries:
        try:
            analysis = await orchestrator.route_query_intelligent(query)
            results.append({
                "query": query,
                "primary_agent": analysis["primary_agent"],
                "confidence": analysis["confidence"],
                "is_multi_domain": analysis["is_multi_domain"],
                "reasoning": analysis["reasoning"]
            })
        except Exception as e:
            results.append({
                "query": query,
                "error": str(e)
            })
    
    return {
        "test_results": results,
        "routing_system": orchestrator.llm_router.get_routing_stats()
    }