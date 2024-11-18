import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
//import * as THREE from "./lib/three.module.js";
//import { OrbitControls } from "./lib/OrbitControls.js";
import { $el } from "../../scripts/ui.js";

import { ThreeCanvas } from "./ThreeCanvas.js";

const DEBUG = true;



// Function create widget
async function widgetThreeJS(node, nodeName, base_filename, inputData, app) {
  // Find widget stored image filename for threejs, and hide him.
  const widgeImageThree = node.widgets.find((w) => w.name === "imageThreejs");
  widgeImageThree.value = base_filename;
  widgeImageThree.type = "converted-widget";

  widgeImageThree.computeSize = () => [0, -4];
  if (widgeImageThree.linkedWidgets) {
    for (const link of widgeImageThree.linkedWidgets) {
      link.type = "converted-widget";
      link.computeSize = () => [0, -4];
    }
  }

  const threeCanvas = new ThreeCanvas(node, widgeImageThree);
  threeCanvas.init();

  // Add panel widget
  const panelWrapper = $el("div.threeCanvasPanelWrapper", {}, [
    $el(
      "div.threeCanvasPanel",
      {
        style: {
          display: "flex",
          padding: "0px",
          margin: "0px",
          background: "#5a5a5a",
          minHeight: "30px",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "2px",
        },
      },
      [
        $el("button.threeCanvasAdd", {
          style: {
            padding: "3px",
          },
          textContent: "Add",
          onclick: (e) =>
            threeCanvas.addObjectToScene(
              "sphere",
              function () {
                this.object.rotation.z += 0.01;
              },
              { radius: 0.5, widthSegments: 6, heightSegments: 6 },
              { color: "red" }
            ),
        }),
        $el("button.threeCanvasDel", {
          style: {
            padding: "3px",
            color: "red",
          },
          textContent: "Del",
          onclick: (e) => alert("Dev..."),
        }),
      ]
    ),
  ]);

  const panelWidget = node.addDOMWidget(
    nodeName,
    "threeCanvasPanel",
    panelWrapper
  );
  panelWidget.computeSize = () => {
    return [node.size[0], 45];
  };
  // end - Panel

  // Add widget threeCanvas
  const dom = threeCanvas.getDom();
  const widget = node.addDOMWidget("threeCanvas", "custom_widget", dom, {
    getValue() {
      return { test_value: "hello world" };
    },
    setValue(v) {
      // console.log(v);
    },
  });

  const origDraw = widget.draw;
  widget.draw = function () {
    origDraw?.apply(this, arguments);
    const [ctx, nodeThree, widgetWidth, posY] = arguments;
    nodeThree.size[1] = posY + threeCanvas.size.h + threeCanvas.size.offset;

    // Update renderer
    threeCanvas.update(node.size[0]);
    //app.graph.setDirtyCanvas(true, false);
  };

  widget.threeCanvas = threeCanvas;
  // widget.callback = () => {};

  // Note: If the node is collapsed, the draw method does not work and the canvas will not update.
  // const animator = () => {
  //   threeCanvas.update(node.size[0]);
  //   app.graph.setDirtyCanvas(true, false);
  //   requestAnimationFrame(animator);
  // };

  // requestAnimationFrame(animator);

  // Serialize node data, you can save the image here too
  node.onSerialize = (n) => {
    //console.log('YOOOOO')
  };

  node.onDragOver = function (e) {
    return false;
  };
  node.onDragDrop = function (e) {
    return false;
  };

  console.log(api.queuePrompt);

  // https://docs.comfy.org/essentials/comms_messages
  api.addEventListener("execution_start", async () => {
    console.log("execution_start...");
    await threeCanvas.sendFileToServer(widgeImageThree.value);
  });

  // Custom event save image
  // Run when inside three_view.py, variable WAIT_IMAGE_SAVE = True, execution_start need add comment.
  api.addEventListener("lth_save_image", async ({ detail }) => {
    const { unique_id } = detail;
    if (+unique_id !== node.id) return;

    await threeCanvas
      .sendFileToServer(widgeImageThree.value)
      .then(async (result) => {
        if (result) {
          await api
            .fetchApi("/lth/save_complete", {
              method: "POST",
              body: JSON.stringify({
                unique_id: node.id.toString(),
              }),
            })
            .then((resp) => resp?.json())
            .then((json) => {
              DEBUG &&
                console.log(
                  `ThreeView${unique_id}, filename '${widgeImageThree.value}': ${json?.status}`
                );
              return;
            });
        }
      })
      .catch((err) => DEBUG && console.error(`Error save image: ${err}`));
  });

  await threeCanvas.sendFileToServer(widgeImageThree.value);

  return widget;
}

app.registerExtension({
  name: "Three View",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeType.comfyClass === "ThreeView") {
      nodeType.prototype.onExecuted = async function (message) {
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
        const base_filename = `${
          nodeData.name
        }${nodeId}-${d.getUTCFullYear()}_${
          d.getUTCMonth() + 1
        }_${d.getUTCDate()}.png`;

        // Create widget
        const widget = await widgetThreeJS(
          this,
          nodeData.name,
          base_filename,
          nodeData,
          app
        );

        this.title = `${this.type} [${widget.threeCanvas.size.w}x${widget.threeCanvas.size.h}]`;
        return r;
      };

      // onConfigure, load serialized values
      const onConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = async function (w) {
        onConfigure?.apply(this, arguments);
        await this.getTitle(); // wait loaded node

        if (w?.widgets_values?.length) {
          const threeCanvasId = this.widgets.findIndex(
            (wi) => wi.name === "threeCanvas"
          );
          if (threeCanvasId !== -1) {
            this.widgets[threeCanvasId].value = w.widgets_values[threeCanvasId]; // set custom widget value, saves
          }
        }
      };

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
