import { app } from "../../scripts/app.js";
import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";

function resize(w, size, renderer, camera) {
  if (size.w === w) return;
  size.w = w;
  size.h = w * size.r;
  renderer.setSize(size.w, size.h);
  camera.aspect = size.r;
  camera.updateProjectionMatrix();
}

async function widgetThreeJS(node, base_filename, inputData, app) {
  // Create the canvas element once and reuse it
  const canvas = document.createElement("canvas");
  const size = { w: 200, h: 200, r: 1 };

  canvas.width = size.w;
  canvas.height = size.h;

  // Calculate aspect ratio
  const aspectRatio = size.w / size.h;

  // For test: views random cube color,
  const colorsTest = `rgb(${Math.floor(Math.random() * 255)},${Math.floor(
    Math.random() * 255
  )},${Math.floor(Math.random() * 255)})`;

  // Set up three.js scene with blue background
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("blue");

  // Camera setup
  const camera = new THREE.PerspectiveCamera(75, size.r, 0.1, 1000);
  camera.position.z = 3;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(size.w, size.h);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.target.set(0, 0, 0);
  controls.update();

  // Red cube creation
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: colorsTest,
    wireframe: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // const sendImageToBackend = () => {
  //   const dataUrl = canvas.toDataURL(); // Convert canvas to image URL
  //   PromptServer.instance.send_sync("three_image_data", {
  //     image: dataUrl,
  //   });
  // };

  // Find widget stored image filename for threejs, and hide him.
  const widgeImageThreejs = node.widgets.find((w) => w.name === "imageThreejs");
  widgeImageThreejs.value = base_filename;
  widgeImageThreejs.type = "converted-widget";

  widgeImageThreejs.computeSize = () => [0, -4];
  if (widgeImageThreejs.linkedWidgets) {
    for (const link of widgeImageThreejs.linkedWidgets) {
      link.type = "converted-widget";
      link.computeSize = () => [0, -4];
    }
  }

  // Function send image to server
  function sendFileToServer(fileName) {
    return new Promise((res, rej) => {
      // Upload file image to server
      const uploadFile = async (blobFile) => {
        try {
          const resp = await fetch("/upload/image", {
            method: "POST",
            body: blobFile,
          });

          if (resp.status === 200) {
            const data = await resp.json();

            widgeImageThreejs.value = data.name;
            res(true);
          } else {
            alert(resp.status + " - " + resp.statusText);
            rej(false);
          }
        } catch (error) {
          console.log(error);
          rej(false);
        }
      };

      // Convert canvas toBlob object
      canvas.toBlob(async function (blob) {
        let formData = new FormData();
        formData.append("image", blob, fileName);
        formData.append("overwrite", "true");
        //formData.append("type", "temp");
        await uploadFile(formData);
      }, "image/png");
    });
  }

  let delayTime = 0;

  const widget = {
    name: "threeCanvas",
    type: "custom_widget",
    // sketchfile: base_filename + Math.floor(Math.random() * 10000), //unique filename for each widget, don't love this... maybe make it a millis based time stamp?
    draw: function (ctx, node, widgetWidth, posY) {
      // Update cube rotation
      //cube.rotation.x += 0.01
      cube.rotation.y += 0.001;

      // Calculate the new height based on the aspect ratio
      //const newHeight = widgetWidth * aspectRatio

      // Update the renderer size
      //renderer.setSize(widgetWidth, newHeight)
      //camera.aspect = widgetWidth / newHeight
      //camera.updateProjectionMatrix()

      resize(widgetWidth, size, renderer, camera);

      // Render the scene
      renderer.render(scene, camera);

      // Draw the renderer's canvas onto the node's context
      ctx.drawImage(canvas, 0, posY, size.w, size.h);

      // Adjust the node's size to fit the canvas
      node.size[1] = posY + size.h + 10;

      // Optionally, request a redraw for smooth animation
      app.graph.setDirtyCanvas(true, false);

      // Add delay time save image, maybe future save image when translate, rotate, scale, if not animated
      if (delayTime >= 10) {
        //   console.log("Time save file!");
        sendFileToServer(base_filename);
        delayTime = 0;
      }
      delayTime += 1;

      // self.finalImage = canvas.toDataURL("image/png");

      //dataUrl = canvas.toDataURL(); // Convert canvas to image URL
      // PromptServer.instance.send_sync("image_data", { image: dataUrl });
    },
  };

  // Serialize node data, you can save the image here too
  node.onSerialize = () => {};

  node.addCustomWidget(widget);

  node.onDragOver = function (e) {
    return false;
  };
  node.onDragDrop = function (e) {
    return false;
  };

  await sendFileToServer(base_filename);

  return widget;
}

app.registerExtension({
  name: "Three View",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeType.comfyClass === "ThreeView") {
      nodeType.prototype.onExecuted = function (message) {
        console.log("yooooo is running !!!!");
      };

      const onNodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = async function () {
        const r = onNodeCreated
          ? onNodeCreated.apply(this, arguments)
          : undefined;

        const titleNode = await this.getTitle(); // new to load property node
        const nodeId = this.id;

        const d = new Date();
        const base_filename = `ThreeJSNode${nodeId}-${d.getUTCFullYear()}_${
          d.getUTCMonth() + 1
        }_${d.getUTCDate()}.png`;

        // Create widget
        widgetThreeJS(this, base_filename, nodeData, app);

        return r;
      };

      //console.log('YOOOOCH:', nodeType);
      // When the node is executed we will be sent the input text, display this in the widget
      /*const onExecuted = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = function (message) {
            console.log("yooooo");
            //onExecuted?.apply(this, arguments); 
            //populate.call(this, message.text);
        };*/
    }
  },
});

/*app.get('/generate-circle', (req, res) => {

  // Enregistre l'image et envoie le chemin
  const out = fs.createWriteStream('circle.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  res.send('/circle.png');
});*/
