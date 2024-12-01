import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
//import * as THREE from "./lib/three.module.js";
//import { OrbitControls } from "./lib/OrbitControls.js";
import { $el } from "../../scripts/ui.js";

import { ThreeCanvas } from "./ThreeCanvas.js";

const DEBUG = true;

// Function create widget
async function widgetThreeJS(node, nodeData, inputData, app, params = {}) {

    const d = new Date(); 
    const canvasNames = [
        {name:"image", color: "black"},
        {name:"lines", color: "red"},
        {name:"depth", color: "yellow"},
        {name:"normal", color: "#8080ff"}
    ];  
    const base_filenames = canvasNames.map((data)=>`${nodeData.name}${node.id}-${d.getUTCFullYear()}_${d.getUTCMonth() + 1}_${d.getUTCDate()}_${data.name}.png`)

    // Find widget stored image filename for threejs, and hide him.
    const widgeImageThree = node.widgets.find((w) => w.name === "imageThreejs");
    widgeImageThree.value = base_filenames.join()
    widgeImageThree.type = "converted-widget";

    widgeImageThree.computeSize = () => [0, -4];
    if (widgeImageThree.linkedWidgets) {
        for (const link of widgeImageThree.linkedWidgets) {
            link.type = "converted-widget";
            link.computeSize = () => [0, -4];
        }
    }

    let widget = {};

    
    const threeCanvas = new ThreeCanvas(node, widgeImageThree, params);
    threeCanvas.setApi(api);
    threeCanvas.init(canvasNames);

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
                    textContent: "Load",
                    onclick: (e) => {
                        threeCanvas.load()
                        widget?.callback()
                    },
                }),
                $el("button.threeCanvasDel", {
                    style: {
                        padding: "3px",
                        color: "red",
                    },
                    textContent: "X",
                    onclick: (e) => threeCanvas.clear(true),
                }),
                $el("button.threeCanvasSize", {
                    style: {
                        padding: "3px",
                    },
                    textContent: "Canvas size",
                    onclick: (e) => {
                        try {
                            let w = +prompt("Widht:", threeCanvas.size.w);
                            let h = +prompt("Height:", threeCanvas.size.h);

                            // Simple check...
                            if (!w || w <= 0) w = threeCanvas.size.w;
                            if (!h || h <= 0) h = threeCanvas.size.h;

                            if (w) threeCanvas.setCanvasSize(w, h);
                            widget?.callback();
                            app.graph.setDirtyCanvas(true, false);
                        } catch (error) {
                            console.log(error);
                        }

                        // add validate check size
                    },
                }),
                $el("div.threeCanvasViews3Box", {
                    style: {
                    display: "flex",
                }
            },[
                    $el("button.threeCanvasViews3", {
                        style: {
                            padding: "3px",
                        },
                        textContent: "All Views",
                        onclick: (e) => {
                            threeCanvas.VIEWS3 = !threeCanvas.VIEWS3
                            panelWidget.element.querySelector(".threeCanvasViews3_camerafix").style.display = threeCanvas.VIEWS3 ? "block": "none"
                            // threeCanvas.fixCamers = threeCanvas.VIEWS3
                            threeCanvas.setViews3(threeCanvas.wrappers)
                        },
                }),
                $el("input.threeCanvasViews3_camerafix", {
                    type: "checkbox",
                    title: "Fix all camers",
                    checked: threeCanvas.fixCamers,
                    style: {
                        display: "none",
                    },
                    onchange: (e)=>{
                        threeCanvas.fixCamers = !!e.target.checked
                    },
                })]),
            ]
        ),
    ]);

    const panelWidget = node.addDOMWidget(
        nodeData.name,
        "threeCanvasPanel",
        panelWrapper,
        {
            getValue() {
                return "panelWidgetValue";
            },
        }
    );
    panelWidget.computeSize = () => {
        return [node.size[0], 45];
    };
    // end - Panel


    // Add widget threeCanvas
    const threeWrapper = $el("div.threeWrapper", {}, threeCanvas.wrappers);
    widget = node.addDOMWidget("threeCanvas", "custom_widget", threeWrapper, {
        getValue() {
            return threeCanvas.getSavedOptions();
        },
        // setValue(v) {
        //   widget.value = v;
        // },
    });

    const origDraw = widget.draw;
    widget.draw = function () {
        origDraw?.apply(this, arguments);

        const [ctx, nodeThree, widgetWidth, posY] = arguments;
        const w = !threeCanvas.VIEWS3 ? widgetWidth - 25: (widgetWidth - 25)/2;
        const aspect_ratio = threeCanvas.size.h / threeCanvas.size.w;

        Object.assign(threeCanvas.getWrapper().style, {
            width: w + "px",
            height: w * aspect_ratio + "px",
        });

        if( threeCanvas.VIEWS3 ){
            Object.assign(threeCanvas.getWrapper(1).style, {
                width: w + "px",
                height: w * aspect_ratio + "px",
                left: w + 10 + "px"
            });

            Object.assign(threeCanvas.getWrapper(2).style, {
                width: w + "px",
                height: w * aspect_ratio + "px",
                top: parseFloat(threeCanvas.getWrapper().style.height) + 10 + "px"

            });

            Object.assign(threeCanvas.getWrapper(3).style, {
                width: w + "px",
                height: w * aspect_ratio + "px",
                left: w + 10 + "px",
                top: parseFloat(threeCanvas.getWrapper().style.height) + 10 + "px"

            });            
        }


        // Update renderer
        // threeCanvas.update(node.size[0]);
        //app.graph.setDirtyCanvas(true, false);
    };

    widget.threeCanvas = threeCanvas;
    widget.threeWrapper = threeWrapper;

    widget.callback = () => {
        threeWrapper.value = JSON.stringify(threeCanvas.getSavedOptions());
    };

    // Note: If the node is collapsed, the draw method does not work and the canvas will not update.
    // const animator = () => {
    //   threeCanvas.update(node.size[0]);
    //   app.graph.setDirtyCanvas(true, false);
    //   requestAnimationFrame(animator);
    // };

    // requestAnimationFrame(animator);
    node.onResize = function () {
        let [w, h] = this.size;

        let aspect_ratio = 1;

        aspect_ratio = threeCanvas.size.h / threeCanvas.size.w;

        const buffer = 140;

        if (w > 1024) w = w - (w - 1024);
        if (w < 200) w = 200;

        h = w * aspect_ratio + buffer;

        if (h < 200) h = 200 + h / 2;

        this.size = [w, h];
    };

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

    // https://docs.comfy.org/essentials/comms_messages
    // api.addEventListener("execution_start", async () => {
    //   console.log("execution_start...");
    //    await threeCanvas.sendFileToServer(widgeImageThree.value);
    // });

    // Custom event save image
    api.addEventListener("lth_save_image", async ({ detail }) => {
        const { unique_id } = detail;

        if (+unique_id !== node.id) return;

        function reflect(promise){
            return promise.then(function(v){ return {v:v, status: "fulfilled" }},
                                function(e){ return {e:e, status: "rejected" }});
        }

        const promises = base_filenames.map((v, idx)=>threeCanvas.sendFileToServer(v, idx))

        Promise.all(promises.map(reflect)).then(async function (results) {
            const success = results.filter(x => x.status === "fulfilled");
            if (success.length === base_filenames.length) {
                console.log("All images saved successfully. Notifying server...");
                await api.fetchApi("/lth/save_complete", {
                    method: "POST",
                    body: JSON.stringify({
                        unique_id: node.id.toString(),
                    }),
                });
            } else {
                console.error("Some images failed to save. Skipping server notification.");
            }
        });

    });

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

                const titleNode = await this.getTitle(); // need to load properties node
  
                let parameters = {}
  
                try {
                    parameters = {savedData: this?.widgets_values[2]}
                } catch (error) {
                    
                }

                // Create widget
                const widget = await widgetThreeJS(
                    this,
                    nodeData,
                    nodeData,
                    app,
                    parameters
                );


                this.title = `${this.type} [${widget.threeCanvas.size.w}x${widget.threeCanvas.size.h}]`;
                this?.onResize()
                console.log("onCreate")
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
                    
                    if (threeCanvasId !== -1 && w?.widgets_values[threeCanvasId]) {
                        // Get widget threeCanvas by Index
                        const threeCnavasWidget = this.widgets[threeCanvasId].threeCanvas

                        // Get value size and options
                        const {size: sizeData, camera: cameraData, currentModel} =  w.widgets_values[threeCanvasId];

                        // Set size
                        if(sizeData){
                            const { w: width, h: height } = sizeData;
                            if(width && height){ 
                                threeCnavasWidget.setCanvasSize(width, height);
                                this.title = `${this.type} [${width}x${height}]`;
                            }
                        }

                        // Loading last model added
                        if(currentModel){
                            const [subfolder, name] = currentModel.split("/")
                            const urlData = await api.apiURL(
                                `/view?filename=${encodeURIComponent(
                                    name
                                )}&type=input&subfolder=${subfolder}${app.getPreviewFormatParam()}${app.getRandParam()}`
                              );
                            
                            await threeCnavasWidget.loaderGltf.load(urlData, ( glb ) => {
                                threeCnavasWidget.addModel( glb );

                            // Load camera data 
                            if( cameraData ) threeCnavasWidget.loadCameraState( cameraData )
                                                           
                            }, 
                            ( data ) => {/* console.log( `Loaded data: ${data.loaded}/${data.total}` */},
                            ( err ) => {
                                console.log( err );
                                threeCnavasWidget.addHeadTest();
                            })
                        }

                        console.log("onConfigure")
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
