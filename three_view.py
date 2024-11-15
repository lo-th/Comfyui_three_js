from PIL import Image, ImageOps
import hashlib
import base64
from io import BytesIO
import torch
import numpy as np
import requests
from server import PromptServer
import time
from aiohttp import web
import folder_paths


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

# handle proxy response
@PromptServer.instance.routes.post('/HYPE/proxy_reply')
async def proxyHandle(request):
    post = await request.json()
    MessageHolder.addMessage(post["node_id"], post["outputs"])
    return web.json_response({"status": "ok"})


class ThreeView:
    @classmethod
    def INPUT_TYPES(self):
        return {
        "required": {
            "imageThreejs": ("STRING", {"default": "theejs_image.png"})
        },
        "hidden": { "unique_id":"UNIQUE_ID" }
        }
    
    @classmethod
    def IS_CHANGED(self, imageThreejs, unique_id):
        image_path = folder_paths.get_annotated_filepath(imageThreejs)
        m = hashlib.sha256()
        with open(image_path, "rb") as f:
            m.update(f.read())

        return m.digest().hex()

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "process_three_js_image"
    CATEGORY = "lth"
        
    def process_three_js_image(self, imageThreejs, unique_id):
        pathImage = folder_paths.get_annotated_filepath(imageThreejs)
        i = Image.open(pathImage)
        i = ImageOps.exif_transpose(i)
        image = i.convert("RGB")
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]

        return (image,)


NODE_CLASS_MAPPINGS = {
    "ThreeView": ThreeView
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ThreeView": "Three View"
}


