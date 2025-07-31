"""Finance domain agent."""

import time
from typing import Dict, Any
from bookai_adk.agents.base import BaseAgent


class FinanceAgent(BaseAgent):
    """Agent specialized in financial queries and advice."""
    
    def __init__(self):
        super().__init__(
            name="FinanceAgent",
            description="Specialized agent for financial questions, investment advice, and market analysis"
        )
    
    async def process_query(self, query: str, context: Dict[str, Any] = None) -> str:
        """Process financial queries."""
        start_time = time.time()
        
        self.logger.info("Processing financial query", query=query[:100])
        
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
        await asyncio.sleep(0.1)  # 100ms simulated processing
    
    def _generate_response(self, query: str) -> str:
        """Generate appropriate financial response."""
        query_lower = query.lower()
        
        if "etf" in query_lower:
            return """An ETF (Exchange-Traded Fund) is an investment fund that trades on stock exchanges like individual stocks. ETFs typically track an index, commodity, bonds, or a basket of assets. Key benefits include:

• Diversification across many holdings
• Lower expense ratios than mutual funds  
• Intraday trading flexibility
• Tax efficiency
• Transparency of holdings

Popular ETFs include SPY (S&P 500), VTI (Total Stock Market), and QQQ (Nasdaq 100). They're excellent for passive investing strategies."""
        
        elif "invest" in query_lower or "investment" in query_lower:
            return """Here are fundamental investment principles to consider:

• Start early - compound interest is powerful
• Diversify your portfolio across asset classes
• Keep costs low with index funds/ETFs
• Dollar-cost averaging reduces timing risk
• Emergency fund before investing (3-6 months expenses)
• Consider your risk tolerance and time horizon
• Regular rebalancing maintains target allocation

Popular beginner strategies include target-date funds or simple three-fund portfolios (US stocks, international stocks, bonds)."""
        
        elif "index fund" in query_lower:
            return """Index funds are mutual funds designed to track a specific market index like the S&P 500. Benefits include:

• Broad market diversification
• Low expense ratios (often under 0.1%)
• Consistent market returns
• No active management risk
• Automatic rebalancing

Popular options:
• Vanguard Total Stock Market (VTSAX)
• Fidelity Total Market (FZROX) 
• Schwab Total Stock Market (SWTSX)

Index funds are ideal for long-term, passive investing strategies."""
        
        else:
            return f"""I'm FinanceAgent, specialized in financial advice. Your query: "{query}"

I can help with:
• Investment strategies and portfolio allocation
• ETFs, mutual funds, and index fund selection
• Retirement planning (401k, IRA, Roth IRA)
• Market analysis and economic indicators
• Personal finance and budgeting tips
• Risk management and insurance

Please feel free to ask specific financial questions!"""