import re
from urllib.parse import urlparse
from typing import Optional, List, Tuple

def extract_event_id_from_url(url: str) -> Optional[str]:
    """Extract event ID from various URL patterns"""
    
    # Common patterns for event IDs in URLs
    patterns = [
        r'/events?/([a-zA-Z0-9\-_]+)',
        r'/event-([a-zA-Z0-9\-_]+)',
        r'/e/([a-zA-Z0-9\-_]+)',
        r'/tickets/([a-zA-Z0-9\-_]+)',
        r'/ticket/([a-zA-Z0-9\-_]+)',
        r'/show/([a-zA-Z0-9\-_]+)',
        r'/([a-zA-Z0-9\-_]+)/?$',  # ID at the end of URL
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def detect_base_url_pattern(urls: List[str]) -> Optional[str]:
    """Detect base URL pattern from multiple event URLs"""
    
    if len(urls) < 2:
        return None
        
    parsed_urls = [urlparse(url) for url in urls]
    
    # Check if all URLs have the same domain
    domains = set(parsed.netloc for parsed in parsed_urls)
    if len(domains) != 1:
        return None
        
    domain = domains.pop()
    paths = [parsed.path for parsed in parsed_urls]
    
    # Find common path prefix
    if not paths:
        return f"https://{domain}"
        
    common_prefix = paths[0]
    for path in paths[1:]:
        while common_prefix and not path.startswith(common_prefix):
            common_prefix = common_prefix[:-1]
    
    # Remove trailing characters to find pattern
    while common_prefix and common_prefix[-1] in '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_':
        common_prefix = common_prefix[:-1]
    
    # Construct base URL pattern
    base_url = f"https://{domain}{common_prefix}"
    if base_url.endswith('/'):
        base_url = base_url[:-1]
        
    return base_url

def build_event_url(base_url: str, event_id: str) -> str:
    """Build full event URL from base URL and event ID"""
    
    if base_url.endswith('/'):
        base_url = base_url[:-1]
        
    # Common URL patterns
    if '/events' in base_url:
        return f"{base_url}/{event_id}"
    elif '/tickets' in base_url:
        return f"{base_url}/{event_id}"
    else:
        return f"{base_url}/{event_id}"

def parse_bulk_input(input_text: str, base_url: Optional[str] = None) -> List[Tuple[str, str]]:
    """
    Parse bulk input of either URLs or event IDs
    Returns list of (url, event_id) tuples
    """
    
    lines = [line.strip() for line in input_text.split('\n') if line.strip()]
    results = []
    
    for line in lines:
        if line.startswith('http'):
            # It's a full URL
            event_id = extract_event_id_from_url(line)
            results.append((line, event_id))
        elif base_url:
            # It's just an event ID, build the full URL
            full_url = build_event_url(base_url, line)
            results.append((full_url, line))
        else:
            # Just an ID but no base URL
            results.append((line, line))
    
    return results