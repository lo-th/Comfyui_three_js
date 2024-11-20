import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/jsm/controls/OrbitControls.js";
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './lib/jsm/loaders/DRACOLoader.js';

// Class ThreeCanvas
export class ThreeCanvas {

    constructor(node, widget, w = 512, h = 512, r = 1, offset = 10) {
        this.widgeImageThree = widget;
        this.node = node;
        this.size = { w, h, r, offset };
        this.objects = [];
        this.needResize = false;

        // lock scale if false
        this.autoScale = !true;
    }

    getDom(idx=0) {
        return this.tools[idx].renderer.domElement;
    }

    init(views3 = false) {
        this.VIEWS3 = true//views3
        // Calculate aspect ratio
        this.aspectRatio = this.size.w / this.size.h;

        // Set three.js scene
        const scene = new THREE.Scene();

        // Renderer setup 1
        const renderer1 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer1.setSize( this.size.w, this.size.h );
        renderer1.toneMapping = THREE.ACESFilmicToneMapping;
        renderer1.toneMappingExposure = 1;
        renderer1.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid black;";
        renderer1.domElement.setAttribute("view", "LEFT")
        renderer1.domElement.classList.add("threeview_renderer")
        
        // Renderer setup 2
        const renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer2.setSize( this.size.w, this.size.h );
        renderer2.toneMapping = THREE.ACESFilmicToneMapping;
        renderer2.toneMappingExposure = 1;
        renderer2.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid red;";
        renderer2.domElement.setAttribute("view", "TOP")
        renderer2.domElement.classList.add("threeview_renderer")        

        // Renderer setup 3
        const renderer3 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer3.setSize( this.size.w, this.size.h );
        renderer3.toneMapping = THREE.ACESFilmicToneMapping;
        renderer3.toneMappingExposure = 1;
        renderer3.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid yellow;"; 
        renderer3.domElement.setAttribute("view", "FRONT") 
        renderer3.domElement.classList.add("threeview_renderer")               

        // Camera setup 1
        const camera1 = new THREE.PerspectiveCamera(50, this.size.r, 2, 10);
        camera1.lookAt(0, 0, 0);
        camera1.position.set(-4, 0, 0); // left
        
        // Camera setup 2        
        const camera2 = new THREE.PerspectiveCamera(50, this.size.r, 0.1, 1000);
        camera2.position.set(0, -4, 0); // top
        camera2.lookAt(0, 0, 0);

        // Camera setup 3        
        const camera3 = new THREE.PerspectiveCamera(50, this.size.r, 0.1, 1000);
        camera3.position.set(0, 0, -4); // front
        camera3.lookAt(0, 0, 0);

        // Controls setup
        const controls1 = new OrbitControls( camera1, renderer1.domElement );
        controls1.enableDamping = false;
        controls1.maxDistance = 10;
        controls1.minDistance = 1;
        controls1.target.set(0, 0, 0);
        controls1.update();
        controls1.addEventListener( 'change', this.render.bind(this));


        const depthMaterial = new THREE.MeshDepthMaterial()
        const linesMaterial = new THREE.MeshBasicMaterial({ color:0xFFFFFF, wireframe:true});

        // Renderers
        this.tools = [
            { renderer: renderer1, camera: camera1, controls: controls1, material:null },
        ];

        if(this.VIEWS3){
        // Controls setup
            const controls2 = new OrbitControls(  camera2, renderer2.domElement );
            controls2.enableDamping = false;
            controls2.maxDistance = 10;
            controls2.minDistance = 1;
            controls2.target.set(0, 0, 0);
            controls2.update();
            controls2.addEventListener( 'change', this.render.bind(this)); 

                   
   
            // Controls setup
            const controls3 = new OrbitControls( camera3, renderer3.domElement );
            controls3.enableDamping = false;
            controls3.maxDistance = 10;
            controls3.minDistance = 1;
            controls3.target.set(0, 0, 0);
            controls3.update();
            controls3.addEventListener( 'change', this.render.bind(this)); 

             

            this.tools.push({ renderer: renderer2, camera: camera2, controls: controls2, material:depthMaterial });
            this.tools.push({ renderer: renderer3, camera: camera3, controls: controls3, material:linesMaterial });
        } else {
            this.tools.push({ material:depthMaterial });
            this.tools.push({ material:linesMaterial });
        }

//         const controls = new OrbitControls( camera, renderer.domElement );
//         controls.enableDamping = false;
//         controls.maxDistance = 10;
//         controls.minDistance = 1;
//         controls.target.set(0, 0, 0);
//         controls.update();
//         controls.addEventListener( 'change', this.render.bind(this));
//         controls.addEventListener( 'end', this.sendFileToServer.bind(this, this.widgeImageThree.value));

//         // drop model direcly on view
//         document.body.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
//         document.body.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
//         document.body.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
//         document.body.addEventListener( 'drop', this.drop.bind(this), false );

        this.renderer = renderer1;
        this.controls = controls1;
        this.camera = camera1;

        this.scene = scene;

        // Add default object
        // this.addObjectToScene("cube");

        this.initLoader()
        this.addHeadTest()

        this.render();

        this.animate();
    }

    initLoader(){

        const dracoPath = new URL(`./lib/jsm/libs/draco/gltf/`, import.meta.url);
        const dracoLoader = new DRACOLoader().setDecoderPath( dracoPath.href )
        dracoLoader.setDecoderConfig({ type: 'js' });
        this.loaderGltf = new GLTFLoader().setDRACOLoader(dracoLoader);

    }

    drop( e ){

        e.preventDefault();
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        const name = file.name;
        const type = name.substring(name.lastIndexOf('.')+1, name.length );
        const finalName = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') );
        reader.readAsArrayBuffer( file );

        if( type==='glb' ) e.stopPropagation()

        reader.onload = function ( e ) {
            if( type==='glb' ) this.directGlb( e.target.result, finalName )
        }.bind(this);

    }

    directGlb( data, name ){

        const self = this;
        const scene = this.scene;

        this.loaderGltf.parse( data, '', function ( glb ) {
            if(this.model) this.scene.remove(this.model);
            const model = glb.scene;
            scene.add( model );
            self.model = model;
            self.render();
        }.bind(this))

    }

    addHeadTest(url = `./assets/head2.glb`){
        const self = this;
        const scene = this.scene;
        const headModel = new URL(url, import.meta.url);

        const light = new THREE.PointLight( 0xffFFFF, 300 );
        light.position.set(-5,10,-10)
        scene.add( light );

        const light2 = new THREE.PointLight( 0xff0000, 100 );
        light2.position.set(5,-10,-5)
        scene.add( light2 );

        const light3 = new THREE.PointLight( 0x00FFFF, 100 );
        light3.position.set(0,5,5)
        scene.add( light3 );

        this.loaderGltf.load( headModel.href, async function ( gltf ) {
            self.addObjectToScene( "model", { update: null, geo: gltf.scene, mat: {color:0xffffff}, scale: {x: 10, y: 10, z: 10}} );
        })

    }

    addObjectToScene(type, parameters = {}) {
        const objectNew = new ThreeObject(type, parameters);

        if (parameters.update && parameters.update instanceof Function)
            objectNew.updateObject = parameters.update.bind(objectNew);

        this.objects.push(objectNew);
        this.scene.add(objectNew.object);
        this.render()
    }

    resize() {

        if (!this.needResize) return;
        
        this.tools.map((data)=>{
            const {renderer, camera} = data
            renderer.setSize(this.size.w, this.size.h)
            camera.aspect = this.size.r;
            camera.updateProjectionMatrix();
        })
        this.needResize = false;
        // this.node.title = `${this.node.type} [${this.size.w}x${this.size.h}]`;

    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.objects.forEach((o) => o.updateObject());
        this.render();
    }

    async render() {
        if (this.autoScale) this.resize();
        //this.tools.forEach((data)=>data.renderer.render(this.scene, data.camera))

        this.tools.forEach((data)=>{
            this.scene.overrideMaterial = !data.material ? null: data.material; 
            return data.renderer.render(this.scene, this.camera)
        })

    }

    setCanvasSize(w, h) {
        if (this.size.w === w) return;
        this.size.w = w;
        this.size.h = h;
        this.size.r = this.size.w / this.size.h;

        this.tools.map((data)=>{
            const {renderer, camera} = data
            renderer.setSize(this.size.w, this.size.h)
            camera.aspect = this.size.r;
            camera.updateProjectionMatrix();
        })

        this.node.title = `${this.node.type} [${this.size.w}x${this.size.h}]`;
        this.render();
        this.node?.onResize()
    }

    async update(widgetWidth, posY) {
        let w = widgetWidth - this.size.offset;
        if (this.size.w === w) return;
        this.size.w = w;
        this.size.h = w * this.size.r;
        this.needResize = true;
    }

    // Function send image to server
    async sendFileToServer(fileName, idx) {
        this.render();
        
        if(!this.VIEWS3) idx = 0
        
        return new Promise((res) => {
            const uploadFile = async (blobFile) => {
                try {
                    const resp = await fetch("/upload/image", {
                        method: "POST",
                        body: blobFile,
                    });
    
                    if (resp.status === 200) {
                        console.log(`Image saved successfully: ${fileName}`);
                        res(true);
                    } else {
                        console.error(`Error saving image: ${resp.status} - ${resp.statusText}`);
                        res(false);
                    }
                } catch (error) {
                    console.error(`Error during file upload: ${error}`);
                    res(false);
                }
            };
    
            this.getDom(idx).toBlob(function (blob) {
                if (!blob) {
                    console.error("Blob creation failed for", fileName);
                    res(false);
                    return;
                }
                let formData = new FormData();
                formData.append("image", blob, fileName);
                formData.append("overwrite", "true");
                uploadFile(formData);
            }, "image/png");
        });
    }
}

class ThreeObject {
    constructor(type, parameters = {}) {
        this.type = type;
        this.addObject(parameters);
    }

    static constructorCall(constr, args){
        return new constr(...args)
    }

    addObject(parameters = {}) {
		const {
            update = null,
            geo = [],
            mat = {},
            pos = {},
            scale = {}
		} = parameters;


        const _material = {
            color: `rgb(${Math.floor(Math.random() * 255)},${Math.floor(
                Math.random() * 255
            )},${Math.floor(Math.random() * 255)})`,
            wireframe: true,
            ...mat,
        };
        const _position = { x: 0, y: 0, z: 0, ...pos };
        const _scale = { x: 1, y: 1, z: 1, ...scale };
        let _geometry;

        switch (this.type) {
            case "model":
                this.object = geo
                geo.children[0].material = new THREE.MeshStandardMaterial({color:0xffffff})
                break;
            case "sphere":
                _geometry = ThreeObject.constructorCall(THREE.SphereGeometry, geo)
                break;
            default:
                _geometry = ThreeObject.constructorCall(THREE.BoxGeometry, geo);
        }

        if(["cube", "sphere"].includes(this.type)) {
            const material = new THREE.MeshBasicMaterial(_material);
            this.object = new THREE.Mesh(_geometry, material);
        }

        this.object.position.set(_position.x, _position.y, _position.z);
        this.object.scale.set(_scale.x, _scale.y, _scale.z);
    }

    updateObject() {
        this.object.rotation.y += 0.001;

        const time = performance.now() / 1000;
        const scale = Math.abs(Math.sin(time)) + 10
        this.object.scale.set(scale,scale,scale)

    }
}
