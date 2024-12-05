import os
import PIL
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
import json


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
THREEVIEW_DICT = {}  # ThreeView dict instances

# Directory threejs
extension_threejs = os.path.dirname(os.path.realpath(__file__))

# Support extension models
support_ext = ("glb",)
def getModelsInDir(folder, path):
    list_models = []
    for model in os.scandir(folder):
        if not model.is_file():
            continue

        model_file_size = model.stat().st_size
        if model_file_size == 0:
            continue

        model_file = model.name.split(".")
        ext = model_file[-1]

        if ext not in support_ext:
            continue

        pathFile = os.path.join(path, model.name)

        # model_file_name = ".".join(model_file[:-1])
        list_models.append({"name": model.name, "size": model_file_size, "path": pathFile})

    return list_models


def createJsonFileStartup():
    models_js_dir = os.path.join(extension_threejs, "js")
    models_assets_dir = os.path.join(models_js_dir, "assets")

    # Assets directory
    if not os.path.exists(models_assets_dir):
        return

    models = {
        "default": getModelsInDir(models_assets_dir, "./assets/"),
    } 

    saveFilePath = os.path.join(models_js_dir, "models_default.json")
    with open(saveFilePath, "w+", encoding="utf-8") as file:
        file.write(json.dumps(models, indent=4))
        

# Create on startup default models json file in assets directory 
createJsonFileStartup()


@PromptServer.instance.routes.get("/lth/models")
async def getModels(request):
    try:
        models_assets_dir = os.path.join(extension_threejs, "js", "assets")
        models_input_dir = os.path.join(folder_paths.get_input_directory(), "ThreeViewModels")

        models = {
            "default": [],
           "loaded": []
        } 

        # Assets directory
        if os.path.exists(models_assets_dir):
            models["default"] = getModelsInDir(models_assets_dir, "./assets/")
        else:
            print(f"ThreeView: Path {models_assets_dir} not exists!")

        # Input > ThreeViewModels directory
        if os.path.exists(models_input_dir):
            models["loaded"] = list(map(lambda x: {**x, "path": f"/view?filename={x['name']}&type=input&subfolder=ThreeViewModels"}, getModelsInDir(models_input_dir, "")))
        else:
            print(f"ThreeView: Path {models_input_dir} not exists!")

        return web.json_response({"status":"ok", "models": models}, status=200)
    
    except Exception as err:
        print("ThreeView: Get models error", err)
        return web.json_response({"status":"error"}, status=500)

@PromptServer.instance.routes.get("/api/lth/")
async def indexPage(request):
    pathIndex = os.path.join(extension_threejs, "js", "index.html")
    response = web.FileResponse(pathIndex)
    response.headers['Cache-Control'] = 'no-cache'
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@PromptServer.instance.routes.post("/lth/save_complete")
async def checkSaveImage(request):
    json_data = await request.json()
    unique_id = json_data.get("unique_id", None)

    if unique_id is not None and unique_id in THREEVIEW_DICT:
        THREEVIEW_DICT[unique_id] = True
        return web.json_response({"status": "Complete"}, status=200)

    return web.json_response({"status": "Error invalid unique_id"}, status=400)
    

def waitSaveImage(unique_id, time_out=100):
    for _ in range(time_out):
        if (THREEVIEW_DICT.get(unique_id, False) == True):
            THREEVIEW_DICT[unique_id] = False

            if DEBUG:
                print(f"File for ThreeView{unique_id} is ready")            
            return True

        time.sleep(0.1)

    if DEBUG:
        print(f"Timeout waiting for ThreeView{unique_id}")
    return False

class ThreeView:
    savedimage = False      

    @classmethod
    def INPUT_TYPES(self):
        return {
        "required": {
            "imageThreejs": ("STRING", {"default":"theejs_image.png,theejs_image_lines.png,theejs_image_depth.png,theejs_image_normal.png"},)
        },
        "hidden": { "unique_id":"UNIQUE_ID" }
        }

    @classmethod
    def IS_CHANGED(self, imageThreejs, unique_id):
        if unique_id not in THREEVIEW_DICT:
            THREEVIEW_DICT[unique_id] = False

        THREEVIEW_DICT[unique_id] = False
        # Send to save image
        PromptServer.instance.send_sync("lth_save_image", {"unique_id": unique_id})

        waitSaveImage(unique_id)           

        return float("NaN") #m.digest().hex()


    RETURN_TYPES = ("IMAGE", "IMAGE", "IMAGE", "IMAGE")
    RETURN_NAMES = ("image", "lines", "depth", "normal")
    FUNCTION = "process_three_js_image"
    CATEGORY = "lth"


    def process_three_js_image(self, imageThreejs, unique_id):
        imageThreejs = imageThreejs.split(",")
        images_make = []

        for imageName in imageThreejs:
            pathImage = folder_paths.get_annotated_filepath(imageName)

            for _ in range(5):
                if os.path.exists(pathImage) and os.path.getsize(pathImage) > 0:
                    try:
                        with Image.open(pathImage) as i:
                            i = ImageOps.exif_transpose(i)
                            image = i.convert("RGB")
                            image = np.array(image).astype(np.float32) / 255.0
                            image = torch.from_numpy(image)[None,]
                            images_make.append(image)
                            break
                    except (OSError, SyntaxError, PIL.UnidentifiedImageError) as e:
                        if DEBUG:
                            print(f"Error reading image {imageName}: {e}. Retrying...")
                else:
                    if DEBUG:
                        print(f"File {imageName} not ready. Waiting...")
                
                time.sleep(0.5)
            else:
                if DEBUG:
                    print(f"Failed to process {imageName} after multiple attempts.")
                images_make.append(None)

        return tuple(images_make)


NODE_CLASS_MAPPINGS = {
    "ThreeView": ThreeView
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ThreeView": "Three View"
}


