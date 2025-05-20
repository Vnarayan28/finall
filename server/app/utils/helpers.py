import re
import logging

logger = logging.getLogger(__name__)

def parse_duration(iso_str: str) -> tuple:
    try:
        hours = minutes = seconds = 0
        
        # PT1H2M3S or P1DT1H2M3S (ignore date part for now if present)
        # Only match time part after 'T' if 'P' and 'T' are present, or just time if only 'P' is present
        time_part_match = re.search(r'T?((\d+)H)?((\d+)M)?((\d+)S)?$', iso_str)
        if not time_part_match:
            # Try matching if only H, M, S are present without P or T (less common for ISO 8601 duration)
            time_part_match = re.search(r'((\d+)H)?((\d+)M)?((\d+)S)?$', iso_str)
            if not time_part_match:
                logger.warning(f"Could not parse time components from ISO duration string: {iso_str}")
                return None, 0
        
        # Extract groups for H, M, S from the matched time part
        # Group indices are based on the regex: ( (2)H )? ( (4)M )? ( (6)S )?
        # So H is group 2, M is group 4, S is group 6
        if h_g := time_part_match.group(2): hours = int(h_g)
        if m_g := time_part_match.group(4): minutes = int(m_g)
        if s_g := time_part_match.group(6): seconds = int(s_g)
        
        total_seconds = hours * 3600 + minutes * 60 + seconds
        
        if total_seconds == 0 and 'P' in iso_str and not (hours or minutes or seconds): # Check if it was PT0S or similar which means 0
             if not (time_part_match.group(2) or time_part_match.group(4) or time_part_match.group(6)): # No H, M, S digits found
                logger.debug(f"ISO duration string {iso_str} seems to be zero or unparseable for H,M,S time parts.")
                # If it's truly PT0S, total_seconds would be 0. If it's P something without T, this logic is fine.

        min_duration_seconds = 240 # 4 minutes
        if total_seconds < min_duration_seconds:
            return None, total_seconds
        
        h_disp = total_seconds // 3600
        m_disp = (total_seconds % 3600) // 60
        s_disp = total_seconds % 60
        
        if h_disp > 0:
            readable_duration = f"{h_disp}:{m_disp:02d}:{s_disp:02d}"
        else:
            readable_duration = f"{m_disp:02d}:{s_disp:02d}"
            
        return readable_duration, total_seconds
    except Exception as e:
        logger.error(f"Duration parsing failed for '{iso_str}': {str(e)}", exc_info=True)
        return None, 0