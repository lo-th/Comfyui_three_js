from .three_view import ThreeView

NODE_CLASS_MAPPINGS = {
    "ThreeView": ThreeView
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ThreeView": "Three View"
}

WEB_DIRECTORY = "./js"

# Colors terminal
GREEN = "\033[92m"
LIGHT_YELLOW = "\033[93m"
MAGNETA = "\033[95m"
BLUE = "\033[94m"
CLEAR = "\033[0m"

# Info message
nodesNames = ", ".join(NODE_DISPLAY_NAME_MAPPINGS.values())
print(f"\n{MAGNETA}* {GREEN}lo-th -> {LIGHT_YELLOW}{nodesNames} {BLUE}<Loaded>{CLEAR}")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]