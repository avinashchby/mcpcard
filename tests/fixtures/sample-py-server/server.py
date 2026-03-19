from mcp.server.fastmcp import FastMCP

mcp = FastMCP("python-test-server")

@mcp.tool()
def search_files(query: str, path: str = ".") -> str:
    """Search for files matching a query pattern."""
    return f"Found files for {query}"

@mcp.tool()
def read_file(path: str) -> str:
    """Read the contents of a file at the given path."""
    return "file contents"

@mcp.resource("config://app")
def get_config() -> str:
    """Get application configuration."""
    return "{}"

@mcp.prompt()
def review_code(code: str) -> str:
    """Generate a code review prompt."""
    return f"Review this code: {code}"
