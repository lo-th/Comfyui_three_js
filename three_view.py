from PIL import Image
import base64
from io import BytesIO
import torch
import numpy as np
import requests
from server import PromptServer
import time
from aiohttp import web
import folder_paths

# handle proxy response
@PromptServer.instance.routes.post('/HYPE/proxy_reply')
async def proxyHandle(request):
    post = await request.json()
    MessageHolder.addMessage(post["node_id"], post["outputs"])
    return web.json_response({"status": "ok"})

class ThreeView:
    @classmethod
    def INPUT_TYPES(s):
        return {
        "required": {},
        "hidden": { "unique_id":"UNIQUE_ID", "image_data" : ("IMAGE", {}) }
        }
    def IS_CHANGED(id):
        return True

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "process_three_js_image"
    CATEGORY = "lth"
        
    def process_three_js_image(self, unique_id, image_data):

        # Decode the image from base64
        #image_data = self.finalImage
        #image_data = image_data.split(",")[1]
        image_data = np.zeros((512, 768, 3), dtype=np.uint8)
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Convert the PIL image to a PyTorch tensor
        image_np = np.array(image).astype(np.float32) / 255.0
        image_tensor = torch.from_numpy(image_np).unsqueeze(0).permute(0, 3, 1, 2)

        return (image_tensor,)


NODE_CLASS_MAPPINGS = {
    "ThreeView": ThreeView
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ThreeView": "Three View"
}


# Message Handling
class MessageHolder:
    messages = {}

    @classmethod
    def addMessage(self, id, message):
        self.messages[str(id)] = message

    @classmethod
    def waitForMessage(self, id, period = 0.1):
        sid = str(id)
        while not (sid in self.messages):
            time.sleep(period)
        message = self.messages.pop(str(id),None)
        return message


