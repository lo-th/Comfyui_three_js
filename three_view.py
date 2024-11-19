from PIL import Image, ImageOps
import hashlib
import base64
from io import BytesIO
import torch
import numpy as np
import requests
import asyncio
from server import PromptServer
import time
from aiohttp import web
import folder_paths


# Message Handling
# class MessageHolder:
#     messages = {}

#     @classmethod
#     def addMessage(self, id, message):
#         self.messages[str(id)] = message

#     @classmethod
#     def waitForMessage(self, id, period = 0.1):
#         sid = str(id)
#         while not (sid in self.messages):
#             time.sleep(period)
#         message = self.messages.pop(str(id),None)
#         return message

# handle proxy response
# @PromptServer.instance.routes.post('/HYPE/proxy_reply')
# async def proxyHandle(request):
#     post = await request.json()
#     MessageHolder.addMessage(post["node_id"], post["outputs"])
#     return web.json_response({"status": "ok"})


# Global variables
DEBUG = True
WAIT_IMAGE_SAVE = False # Other method save image, send request to lth_save_image (in javascript) and wait complete save image to continue process generate
THREEVIEW_DICT = {}  # ThreeView dict instances


@PromptServer.instance.routes.post("/lth/save_complete")
async def checkSaveImage(request):
    json_data = await request.json()
    unique_id = json_data.get("unique_id", None)

    if unique_id is not None and unique_id in THREEVIEW_DICT:
        THREEVIEW_DICT[unique_id].savedimage = True
        return web.json_response({"status": "Complete"}, status=200)

    return web.json_response({"status": "Error"}, status=200)


class ThreeView:
    @classmethod
    def INPUT_TYPES(self):
        self.savedimage = False

        return {
        "required": {
            "imageThreejs": ("STRING", {"default":"theejs_image1.png,theejs_image2.png,theejs_image3.png"},)
        },
        "hidden": { "unique_id":"UNIQUE_ID" }
        }


    @classmethod
    def IS_CHANGED(self, imageThreejs, unique_id):
        # image_path = folder_paths.get_annotated_filepath(imageThreejs)
        # m = hashlib.sha256()
        # with open(image_path, "rb") as f:
        #     m.update(f.read())

        return float("NaN") #m.digest().hex()


    RETURN_TYPES = ("IMAGE","IMAGE","IMAGE",)
    RETURN_NAMES = ("image1","image2","image3")
    FUNCTION = "process_three_js_image"
    CATEGORY = "lth"


    async def waitSaveImage(self, time_out=50):
        for _ in range(time_out):
            if (hasattr(self, "savedimage") and self.savedimage == True):
                self.savedimage = False
                return True

            await asyncio.sleep(0.1)

        return False


    def process_three_js_image(self, imageThreejs, unique_id):
        if unique_id not in THREEVIEW_DICT:
            THREEVIEW_DICT[unique_id] = self

        THREEVIEW_DICT[unique_id].savedimage = False

        if WAIT_IMAGE_SAVE:
            # Send to save image
            PromptServer.instance.send_sync("lth_save_image", {"unique_id": unique_id})

            if not asyncio.run(self.waitSaveImage()):
                if DEBUG:
                    print(f"ThreeView {unique_id}: not saved!")
            else:
                if DEBUG:
                    print(f"ThreeView {unique_id}: save completed!")        
        
        # images_make = []
        # for imageName in imageThreejs:
        imageThreejs = imageThreejs.split(",")
        pathImage1 = folder_paths.get_annotated_filepath(imageThreejs[0])
        i1 = Image.open(pathImage1)
        i1 = ImageOps.exif_transpose(i1)
        image1 = i1.convert("RGB")
        image1 = np.array(image1).astype(np.float32) / 255.0
        image1 = torch.from_numpy(image1)[None,]

        pathImage2 = folder_paths.get_annotated_filepath(imageThreejs[1])
        i2 = Image.open(pathImage2)
        i2 = ImageOps.exif_transpose(i2)
        image2 = i2.convert("RGB")
        image2 = np.array(image2).astype(np.float32) / 255.0
        image2 = torch.from_numpy(image2)[None,]

        pathImage3 = folder_paths.get_annotated_filepath(imageThreejs[2])
        i3 = Image.open(pathImage3)
        i3 = ImageOps.exif_transpose(i3)
        image3 = i3.convert("RGB")
        image3 = np.array(image3).astype(np.float32) / 255.0
        image3 = torch.from_numpy(image3)[None,]


      


        return (image1,image2,image3)


NODE_CLASS_MAPPINGS = {
    "ThreeView": ThreeView
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ThreeView": "Three View"
}


