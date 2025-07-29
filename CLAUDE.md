# BookAI - Claude Development Guidelines

## Project Overview
BookAI is a web implementation integrating Open WebUI capabilities with Google Cloud/Vertex AI and Supabase. This project creates a self-hosted AI interface with advanced features for book-related AI assistance.

## Development Workflow

### GitHub Issue Management
- **Always use GitHub issues for task tracking and project management**
- Create detailed issues with acceptance criteria, dependencies, and priority levels
- Use sub-issues to break down complex features into manageable tasks
- Comment on issues with implementation plans and progress updates
- Reference issues in commit messages using `#issue-number`

### Issue Lifecycle
1. **Planning Phase**: Create main issue with comprehensive plan
2. **Breaking Down**: Create sub-issues for different phases/components  
3. **Implementation**: Work on issues in priority order
4. **Review**: Update issues with progress and mark completed tasks
5. **Closure**: Close issues only when all acceptance criteria are met

### Branch Strategy
- Create feature branches for each issue: `feature/issue-{number}-{description}`
- Make commits with descriptive messages referencing issues
- Create pull requests when features are ready for review

### Current Project Structure
```
BookAI/
├── .env                    # Environment configuration
├── .claude/               # Claude-specific settings
├── config/               # Configuration files
└── [to be created]       # Web implementation structure
```

### Environment Setup
- **Google Cloud/Vertex AI**: Configured for Gemini 2.0 Flash model
- **Supabase**: Database and authentication backend
- **Open WebUI**: Target web interface framework

### Development Priorities
1. **Phase 1**: Foundation Setup (#2) - High Priority
2. **Phase 2**: Core Features (#3) - High Priority  
3. **Phase 3**: Advanced Features (#4) - Medium Priority
4. **Phase 4**: Enhancement (#5) - Low Priority

### Key Commands
- `gh issue create --title "Title" --body "Description"` - Create new issues
- `gh issue comment {number} --body "Comment"` - Add comments to issues
- `gh issue view {number}` - View issue details

### Best Practices
- Always reference parent issues in sub-issues
- Update issue status as work progresses
- Use GitHub CLI for efficient issue management
- Document implementation decisions in issue comments
- Test integration with existing Google Cloud/Supabase setup

## Technical Stack
- **Backend**: Open WebUI + Google Cloud Vertex AI
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Open WebUI interface
- **Deployment**: Docker containerization
- **AI Model**: Gemini 2.0 Flash (configured in .env)

## Notes
- This project maintains existing Google Cloud and Supabase configurations
- All development should follow the phase-based approach outlined in Issue #1
- GitHub workflow integration is essential for project tracking and collaboration