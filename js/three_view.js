import { app } from '../../scripts/app.js'
import * as THREE from './lib/three.module.js'
import { OrbitControls } from './lib/OrbitControls.js';


let canvas, scene, camera, renderer, controls, dataUrl;
const size = {w:200, h:200, r:1}


function resize( w ) {

    if(size.w === w) return
    size.w = w
    size.h = w*size.r
    renderer.setSize(size.w, size.h);
    camera.aspect = size.r;
    camera.updateProjectionMatrix();
}


app.registerExtension({
    name: 'Three View',
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === 'ThreeView') {
            nodeType.prototype.onExecuted = function (message) {
                console.log("yooooo is running !!!!");
            }
            nodeType.prototype.onNodeCreated = function () {
                // Create the canvas element once and reuse it
                canvas = document.createElement('canvas')

                canvas.width = size.w
                canvas.height = size.h

                // Calculate aspect ratio
                const aspectRatio = size.w / size.h

                // Set up three.js scene with blue background
                scene = new THREE.Scene()
                scene.background = new THREE.Color('blue')

                // Camera setup
                camera = new THREE.PerspectiveCamera(75, size.r, 0.1, 1000)
                camera.position.z = 3

                // Renderer setup
                renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
                renderer.setSize(size.w, size.h)

                controls = new OrbitControls( camera, renderer.domElement );
                controls.enableDamping = true;
                controls.minDistance = 1;
                controls.maxDistance = 10;
                controls.target.set( 0, 0, 0 );
                controls.update();

                // Red cube creation
                const geometry = new THREE.BoxGeometry(1, 1, 1)
                const material = new THREE.MeshBasicMaterial({ color: 'red', wireframe:true  })
                const cube = new THREE.Mesh(geometry, material)
                scene.add(cube)

                const sendImageToBackend = () => {
                    const dataUrl = canvas.toDataURL(); // Convert canvas to image URL
                    PromptServer.instance.send_sync("three_image_data", { image: dataUrl });
                };

                const d = new Date();
                const base_filename = d.getUTCFullYear() + "_" + (d.getUTCMonth()+1) + "_" + d.getUTCDate() + '_';

                const self = this;

                const widget = {
                    name: 'threeCanvas',
                    type: 'custom_widget',
                    sketchfile: base_filename + Math.floor(Math.random() * 10000), //unique filename for each widget, don't love this... maybe make it a millis based time stamp?
                    draw: function (ctx, node, widgetWidth, posY) {
                        // Update cube rotation
                        //cube.rotation.x += 0.01
                        cube.rotation.y += 0.001

                        // Calculate the new height based on the aspect ratio
                        //const newHeight = widgetWidth * aspectRatio

                        // Update the renderer size
                        //renderer.setSize(widgetWidth, newHeight)
                        //camera.aspect = widgetWidth / newHeight
                        //camera.updateProjectionMatrix()

                        resize( widgetWidth );

                        // Render the scene
                        renderer.render(scene, camera)

                        // Draw the renderer's canvas onto the node's context
                        ctx.drawImage(canvas, 0, posY, size.w, size.h )

                        // Adjust the node's size to fit the canvas
                        node.size[1] = posY + size.h + 10

                        // Optionally, request a redraw for smooth animation
                        app.graph.setDirtyCanvas(true, false)

                        self.finalImage = canvas.toDataURL("image/png");

                        //

                        //dataUrl = canvas.toDataURL(); // Convert canvas to image URL
                       // PromptServer.instance.send_sync("image_data", { image: dataUrl });
                    }
                }




                this.addCustomWidget(widget)


                //console.log('YOOOOCH:', nodeType);
                // When the node is executed we will be sent the input text, display this in the widget
                /*const onExecuted = nodeType.prototype.onExecuted;
                nodeType.prototype.onExecuted = function (message) {
                    console.log("yooooo");
                    //onExecuted?.apply(this, arguments); 
                    //populate.call(this, message.text);
                };*/

                this.onDragOver = function (e) {return false;}
                this.onDragDrop = function (e) {return false;}
            }
        }
    }
})


/*app.get('/generate-circle', (req, res) => {

  // Enregistre l'image et envoie le chemin
  const out = fs.createWriteStream('circle.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  res.send('/circle.png');
});*/