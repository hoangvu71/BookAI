"""LLM-powered intelligent routing for multi-domain queries."""

import json
import asyncio
from typing import Dict, List, Optional, Tuple, Any
import structlog
import google.generativeai as genai

from bookai_adk.core.config import get_settings


class LLMRouter:
    """Intelligent router using LLM to analyze queries and determine best agents."""
    
    def __init__(self):
        self.logger = structlog.get_logger().bind(component="llm-router")
        self.settings = get_settings()
        
        # Configure Gemini
        if hasattr(self.settings, 'google_api_key') and self.settings.google_api_key:
            genai.configure(api_key=self.settings.google_api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.enabled = True
            self.logger.info("LLM router initialized with Gemini")
        else:
            self.enabled = False
            self.logger.warning("LLM router disabled - no Google API key configured")
    
    def get_agent_descriptions(self) -> Dict[str, str]:
        """Get detailed descriptions of available agents for routing decisions."""
        return {
            "finance": """
            Financial advisor agent specializing in:
            - Investment advice and portfolio management
            - ETFs, stocks, bonds, mutual funds analysis
            - Retirement planning (401k, IRA, etc.)
            - Market analysis and economic trends
            - Personal finance and budgeting
            - Financial calculations and risk assessment
            - Tax implications of investments
            """.strip(),
            
            "code": """
            Programming and software development agent specializing in:
            - Code examples in Python, JavaScript, Java, C++, etc.
            - Web development (REST APIs, frameworks like FastAPI, Django, React)
            - Database design and SQL queries
            - Algorithm explanations and implementations
            - Code optimization and best practices
            - Debugging and troubleshooting
            - Software architecture and design patterns
            - DevOps and deployment strategies
            """.strip()
        }
    
    async def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze a query using LLM to determine routing and complexity.
        
        Returns:
        {
            "primary_agent": "finance|code",
            "confidence": 0.0-1.0,
            "is_multi_domain": bool,
            "secondary_agents": ["agent1", "agent2"],
            "reasoning": "explanation",
            "query_type": "simple|complex|multi_step"
        }
        """
        if not self.enabled:
            return self._fallback_analysis(query)
        
        try:
            agent_descriptions = self.get_agent_descriptions()
            
            prompt = f"""
            You are an intelligent query router for a multi-agent system. Analyze the following user query and determine the best routing strategy.

            AVAILABLE AGENTS:
            {json.dumps(agent_descriptions, indent=2)}

            USER QUERY: "{query}"

            Analyze this query and respond with a JSON object containing:
            {{
                "primary_agent": "finance|code",
                "confidence": 0.0-1.0,
                "is_multi_domain": true/false,
                "secondary_agents": ["agent1", "agent2"] or [],
                "reasoning": "brief explanation of your routing decision",
                "query_type": "simple|complex|multi_step",
                "key_topics": ["topic1", "topic2"]
            }}

            Guidelines:
            - primary_agent: The main agent that should handle this query
            - confidence: How confident you are in this routing (0.0-1.0)
            - is_multi_domain: True if query spans multiple domains (finance + code)
            - secondary_agents: Other agents that might contribute (empty if single domain)
            - reasoning: Brief explanation of why you chose this routing
            - query_type: Simple (direct question), complex (requires analysis), multi_step (requires planning)
            - key_topics: Main topics/concepts in the query

            Examples:
            - "What is an ETF?" → {{"primary_agent": "finance", "confidence": 0.95, "is_multi_domain": false}}
            - "How do I build a trading bot in Python?" → {{"primary_agent": "code", "confidence": 0.8, "is_multi_domain": true, "secondary_agents": ["finance"]}}
            - "Debug my FastAPI code" → {{"primary_agent": "code", "confidence": 0.9, "is_multi_domain": false}}

            Respond ONLY with valid JSON, no additional text.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content, 
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent routing
                    max_output_tokens=500
                )
            )
            
            # Parse the JSON response
            analysis = json.loads(response.text.strip())
            
            # Validate and clean the response
            analysis = self._validate_analysis(analysis)
            
            self.logger.info("LLM routing analysis completed", 
                           query=query[:100], 
                           primary_agent=analysis["primary_agent"],
                           confidence=analysis["confidence"])
            
            return analysis
            
        except json.JSONDecodeError as e:
            self.logger.error("Failed to parse LLM response as JSON", error=str(e))
            return self._fallback_analysis(query)
        except Exception as e:
            self.logger.error("LLM routing analysis failed", error=str(e))
            return self._fallback_analysis(query)
    
    def _validate_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean LLM analysis response."""
        # Set defaults for required fields
        validated = {
            "primary_agent": analysis.get("primary_agent", "finance"),
            "confidence": max(0.0, min(1.0, analysis.get("confidence", 0.5))),
            "is_multi_domain": analysis.get("is_multi_domain", False),
            "secondary_agents": analysis.get("secondary_agents", []),
            "reasoning": analysis.get("reasoning", "Default routing"),
            "query_type": analysis.get("query_type", "simple"),
            "key_topics": analysis.get("key_topics", [])
        }
        
        # Validate primary_agent
        if validated["primary_agent"] not in ["finance", "code"]:
            validated["primary_agent"] = "finance"
            validated["confidence"] = 0.3
        
        # Validate secondary_agents
        valid_agents = {"finance", "code"}
        validated["secondary_agents"] = [
            agent for agent in validated["secondary_agents"] 
            if agent in valid_agents and agent != validated["primary_agent"]
        ]
        
        return validated
    
    def _fallback_analysis(self, query: str) -> Dict[str, Any]:
        """Fallback routing when LLM is not available."""
        query_lower = query.lower()
        
        # Simple keyword-based routing
        finance_keywords = [
            "etf", "invest", "investment", "stock", "bond", "portfolio",
            "index fund", "mutual fund", "401k", "ira", "retirement",
            "dividend", "compound interest", "savings", "budget", "financial",
            "money", "market", "economy", "tax", "wealth", "trading", "trade",
            "trader", "bot", "algorithm trading", "forex", "crypto", "price",
            "profit", "loss", "risk", "strategy", "analysis", "buy", "sell",
            "broker", "exchange", "volatility", "return", "yield"
        ]
        
        code_keywords = [
            "python", "javascript", "java", "code", "function", "api",
            "algorithm", "programming", "software", "debug", "framework",
            "database", "sql", "rest", "web development", "class", "git",
            "docker", "deploy", "server", "client", "frontend", "backend",
            "bot", "script", "automation", "library", "package", "build",
            "develop", "implementation", "logic", "data", "scraping"
        ]
        
        finance_score = sum(1 for keyword in finance_keywords if keyword in query_lower)
        code_score = sum(1 for keyword in code_keywords if keyword in query_lower)
        
        if finance_score > code_score:
            primary = "finance"
            confidence = min(0.8, 0.4 + (finance_score * 0.1))
        elif code_score > finance_score:
            primary = "code"
            confidence = min(0.8, 0.4 + (code_score * 0.1))
        else:
            # Default to finance for ambiguous queries
            primary = "finance"
            confidence = 0.3
        
        is_multi_domain = finance_score > 0 and code_score > 0
        secondary_agents = []
        if is_multi_domain:
            secondary_agents = ["code" if primary == "finance" else "finance"]
        
        return {
            "primary_agent": primary,
            "confidence": confidence,
            "is_multi_domain": is_multi_domain,
            "secondary_agents": secondary_agents,
            "reasoning": f"Keyword-based routing (fallback mode)",
            "query_type": "simple",
            "key_topics": []
        }
    
    async def route_multi_domain_query(
        self, 
        query: str, 
        analysis: Dict[str, Any],
        agents: Dict[str, Any]
    ) -> str:
        """
        Handle multi-domain queries by coordinating between agents.
        """
        primary_agent = analysis["primary_agent"]
        
        if not analysis["is_multi_domain"]:
            # Single domain - route to primary agent
            return await agents[primary_agent].process_query(query)
        
        # Multi-domain query - get responses from both primary and secondary agents
        responses = []
        
        # Get primary agent response
        primary_response = await agents[primary_agent].process_query(query)
        
        # For multi-domain queries, also get responses from secondary agents
        if analysis["secondary_agents"]:
            for secondary_agent in analysis["secondary_agents"]:
                if secondary_agent in agents:
                    secondary_response = await agents[secondary_agent].process_query(query)
                    responses.append({
                        "agent": secondary_agent,
                        "response": secondary_response
                    })
        
        # Combine responses intelligently
        combined_response = self._combine_multi_domain_responses(
            query, 
            primary_agent, 
            primary_response, 
            responses,
            analysis
        )
        
        self.logger.info("Processed multi-domain query", 
                        primary=primary_agent,
                        secondary=analysis["secondary_agents"],
                        combined_length=len(combined_response))
        
        return combined_response
    
    def _combine_multi_domain_responses(
        self,
        query: str,
        primary_agent: str,
        primary_response: str,
        secondary_responses: List[Dict[str, str]],
        analysis: Dict[str, Any]
    ) -> str:
        """Combine responses from multiple agents for multi-domain queries."""
        
        # If no secondary responses, return enhanced primary
        if not secondary_responses:
            return primary_response
        
        # Build a comprehensive response
        combined = f"**Multi-Domain Analysis for: {query}**\n\n"
        
        # Add primary response
        agent_title = "Technical Implementation" if primary_agent == "code" else "Financial Analysis"
        combined += f"## {agent_title} (Primary Focus)\n\n"
        combined += primary_response + "\n\n"
        
        # Add secondary responses
        for resp in secondary_responses:
            agent_title = "Financial Considerations" if resp["agent"] == "finance" else "Technical Considerations"
            combined += f"## {agent_title} (Additional Context)\n\n"
            combined += resp["response"] + "\n\n"
        
        # Add integration note
        combined += "---\n"
        combined += f"*Note: This query spans multiple domains ({primary_agent} + {', '.join([r['agent'] for r in secondary_responses])}). "
        combined += "The above analysis covers both technical and financial aspects to provide a comprehensive answer.*"
        
        return combined
    
    def get_routing_stats(self) -> Dict[str, Any]:
        """Get statistics about routing decisions (placeholder for future metrics)."""
        return {
            "llm_enabled": self.enabled,
            "fallback_mode": not self.enabled,
            "model": "gemini-pro" if self.enabled else "keyword-based"
        }