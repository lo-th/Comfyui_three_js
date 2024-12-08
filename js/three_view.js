import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { addStylesheet } from "../../scripts/utils.js";
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

    

    const panelWidget = node.addDOMWidget(
        nodeData.name,
        "threeCanvasPanel",
        threeCanvas.panelWrapper,
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
    widget = node.addDOMWidget("threeCanvas", "custom_widget", threeCanvas.threeWrapper, {
        getValue() {
            return threeCanvas.getSavedOptions();
        },      
    });

    const origDraw = widget.draw;
    widget.draw = function () {
        origDraw?.apply(this, arguments);

        const [ctx, nodeThree, widgetWidth, posY] = arguments;
        const w =  widgetWidth - 25;
        const aspect_ratio = threeCanvas.size.h / threeCanvas.size.w;

        Object.assign(threeCanvas.threeWrapper.style, {
            width: w + "px",
            height: w * aspect_ratio + "px",
        });

        // Update renderer
        // threeCanvas.update(node.size[0]);
        //app.graph.setDirtyCanvas(true, false);
    };

    widget.threeCanvas = threeCanvas;
    widget.threeWrapper = threeCanvas.threeWrapper;

    document.body.addEventListener("threeview_model_added", ({detail})=>{
        // console.log("Detail:", detail?.currentModel)
    })
    
    widget.callback = () => {};


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
    async init(){

        // Add css styles
        addStylesheet("css/styles.css", import.meta.url);

    },
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
                        const threeCanvasWidget = this.widgets[threeCanvasId].threeCanvas

                        // Get value size and options
                        const {size: sizeData, camera: cameraData, currentModel} =  w.widgets_values[threeCanvasId];

                        // Set size
                        if(sizeData){
                            const { w: width, h: height } = sizeData;
                            if(width && height){ 
                                threeCanvasWidget.setCanvasSize(width, height);
                                this.title = `${this.type} [${width}x${height}]`;
                            }
                        }

                        // Loading last model added
                        if(currentModel){

                            let urlData = ""
                            if(currentModel.indexOf("assets/") === -1){
                                const [subfolder, name] = currentModel.split("/")
                                urlData = await api.apiURL(
                                    `/view?filename=${encodeURIComponent(
                                        name
                                    )}&type=input&subfolder=${subfolder}${app.getPreviewFormatParam()}${app.getRandParam()}`
                                );
                            } else {
                                urlData = new URL(currentModel, import.meta.url).href
                            }
                            
                            await threeCanvasWidget.getLoader('glb').load(urlData, ( glb ) => {
                            threeCanvasWidget.addModel( glb );

                            // Load camera data 
                            if( cameraData ) threeCanvasWidget.loadCameraState( cameraData )
                                                           
                            }, 
                            ( data ) => {/* console.log( `Loaded data: ${data.loaded}/${data.total}` */},
                            ( err ) => {
                                console.log( err );
                                threeCanvasWidget.addHeadTest();
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
