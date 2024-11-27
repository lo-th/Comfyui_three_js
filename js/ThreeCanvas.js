import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/jsm/controls/OrbitControls.js";
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './lib/jsm/loaders/DRACOLoader.js';
import { Outline, Inline, BlackAll } from "./lib/Toon.js";
import { Hub } from "./lib/Hub.js";

// Class ThreeCanvas
export class ThreeCanvas {

    constructor(node, widget, w = 512, h = 512, r = 1, offset = 10) {
        this.widgeImageThree = widget;
        this.node = node;
        this.size = { w, h, r, offset };
        this.objects = [];
        this.needResize = false;
        this.pixelRatio = 1;

        this.globalSize = 3

        this.withHelper = true;
        this.fov = 55;

        // lock scale if false
        this.autoScale = !true;
        this.autoAutoAnim = false;
    }

    getDom(idx=0) {
        return this.tools[idx].renderer.domElement;
    }

    init(views3 = false) {
        // Views3
        this.VIEWS3 = views3

        // Fix camers
        this.fixCamers = true;

        // Calculate aspect ratio
        this.aspectRatio = this.size.w / this.size.h;

        // Set three.js scene
        const scene = new THREE.Scene();

        // Renderer setup 1
        const renderer1 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer1.setSize( this.size.w, this.size.h );
        renderer1.setPixelRatio( this.pixelRatio );
        renderer1.shadowMap.enabled = true;
        renderer1.toneMapping = THREE.ACESFilmicToneMapping;
        renderer1.toneMappingExposure = 1;
        //renderer1.outputColorSpace = THREE.SRGBColorSpace;
        renderer1.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid black;";
        renderer1.domElement.setAttribute("view", "LEFT")
        renderer1.domElement.classList.add("threeview_renderer")
        
        // Renderer setup 2
        const renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer2.setSize( this.size.w, this.size.h );
        renderer2.setPixelRatio( this.pixelRatio );
        renderer2.setClearColor( 0x000000, 1 );
        renderer2.autoClear = false;
        renderer2.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid red;";
        renderer2.domElement.setAttribute("view", "TOP")
        renderer2.domElement.classList.add("threeview_renderer")        

        // Renderer setup 3
        const renderer3 = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer3.setSize( this.size.w, this.size.h );
        renderer3.setPixelRatio( this.pixelRatio );
        renderer3.setClearColor( 0x000000, 1 );
        //renderer3.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer3.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid yellow;"; 
        renderer3.domElement.setAttribute("view", "FRONT") 
        renderer3.domElement.classList.add("threeview_renderer")   

        // Renderer setup 3
        const renderer4 = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer4.setSize( this.size.w, this.size.h );
        renderer4.setPixelRatio( this.pixelRatio );
        renderer4.setClearColor( 0x8080ff, 1 );
        //renderer4.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer4.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid #8080ff;"; 
        renderer4.domElement.setAttribute("view", "FRONT") 
        renderer4.domElement.classList.add("threeview_renderer")             

        // Camera setup 1
        const camera1 = new THREE.PerspectiveCamera(this.fov, this.size.r, 0.1, 10);
        camera1.position.set(0, 0, 5); // front
        camera1.lookAt(0, 0, 0);
        
        // Camera setup 2        
        const camera2 = new THREE.PerspectiveCamera(this.fov, this.size.r, 0.1, 10);
        camera2.position.set(0, 0, 5); // top
        camera2.lookAt(0, 0, 0);

        // Camera setup 3        
        const camera3 = new THREE.PerspectiveCamera(this.fov, this.size.r, 0.1, 10);
        camera3.position.set(0, 0, 5); // front
        camera3.lookAt(0, 0, 0);


        const depthMaterial = new THREE.MeshDepthMaterial()
        const normalMaterial = new THREE.MeshNormalMaterial()

        // Renderers
        this.tools = [
            { type:'color', renderer: renderer1, camera: camera1, material:null },
            { type:'lines', renderer: renderer2, camera: camera2, material:null },
            { type:'depth', renderer: renderer3, camera: camera3, material:depthMaterial },
            { type:'normal', renderer: renderer4, camera: camera3, material:normalMaterial }
        ];


        this.getDom(1).style.display = "none"
        this.getDom(2).style.display = "none"
        this.getDom(3).style.display = "none"

        /*let m0 = new THREE.Mesh(new THREE.BoxGeometry(5,5,5))
        let b0 = new THREE.BoxHelper(m0)
        let m1 = new THREE.Mesh(new THREE.BoxGeometry(3,3,3))
        let b1 = new THREE.BoxHelper(m1, 0xFF0000 )
        scene.add(b0, b1)*/


        // Views3
        this.setViews3()

        const controls = new OrbitControls( camera1, renderer1.domElement );
        controls.enableDamping = false;
        controls.maxDistance = 8;
        controls.minDistance = 0.01;
        controls.target.set(0, 0, 0);
        controls.update();
        controls.addEventListener( 'change', this.render.bind(this));
        //controls.addEventListener( 'end', this.sendFileToServer.bind(this, this.widgeImageThree.value));

//         // drop model direcly on view
        /*document.body.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
        document.body.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
        document.body.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
        document.body.addEventListener( 'drop', this.drop.bind(this), false );*/


        this.camera = camera1;
        this.controls = controls;
        this.scene = scene;

        this.helper = new THREE.Group()
        this.scene.add(this.helper);

        // Add default object
        // this.addObjectToScene("cube");

        this.initLoader();
        this.addHeadTest();

        this.render();

        if(this.autoAutoAnim) this.animate();
    }

    setViews3(){        
        if(this.VIEWS3){            
            this.getDom(1).style.display = "block";
            this.getDom(2).style.display = "block";
            this.getDom(3).style.display = "block";
        } else {
            this.getDom(1).style.display = "none";
            this.getDom(2).style.display = "none";
            this.getDom(3).style.display = "none";
        }
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
        this.loaderGltf.parse( data, '', ( glb ) => { self.addModel( glb ); })

    }

    addHeadTest(url = `./assets/head.glb`){

        const self = this;
        const scene = this.scene;
        const headModel = new URL(url, import.meta.url);

        const light = new THREE.PointLight( 0x0080FF, 300 );
        light.position.set(-5,5,-10)
        scene.add( light );

        const light2 = new THREE.PointLight( 0xff8000, 100 );
        light2.position.set(5,-5,-5)
        scene.add( light2 );

        const light3 = new THREE.PointLight( 0xFFFFFF, 100 );
        light3.position.set(0,5,5)
        scene.add( light3 );

        this.loaderGltf.load( headModel.href, async function ( glb ) { self.addModel( glb ); })

    }

    addModel( glb ){

        if( this.model ) this.scene.remove(this.model);
        this.helper.children = []

        const model = glb.scene || glb.scenes[0];
        const clips = glb.animations || [];

        model.updateMatrixWorld(); 

        let b0 = new THREE.BoxHelper( model, 0x201924 );
        this.helper.add(b0)

        b0.geometry.computeBoundingBox()
        const radius = b0.geometry.boundingSphere.radius;
        const center = b0.geometry.boundingBox.getCenter(new THREE.Vector3());

        console.log(radius)

        let pos = center.clone().add( new THREE.Vector3(0,0,radius*2) )
        let near = radius*0.5;
        let far = radius * 4;

        this.scene.add(model);
        this.model = model;

        // update camera and render
        this.setCamera( pos, center, near, far );

    }

    addObjectToScene(type, parameters = {}) {

        const objectNew = new ThreeObject(type, parameters);

        if (parameters.update && parameters.update instanceof Function)
            objectNew.updateObject = parameters.update.bind(objectNew);


        this.objects.push(objectNew);
        this.scene.add(objectNew.object);
        this.render();

    }

    setCamera( position, center, near, far ) {

        const self = this;

        //this.controls.reset()

        this.tools.map((data)=>{

            const camera = data.camera
            if( camera ){
                camera.aspect = self.size.r;
                camera.fov = self.fov;
                camera.position.copy( position );
                camera.lookAt( center );
                camera.near = near;
                camera.far = far;
                camera.updateProjectionMatrix();
            }

        })

        this.controls.minDistance = near;
        this.controls.maxDistance = far;
        this.controls.target.copy(center);
        this.controls.update();
        //this.controls.saveState();

    }

    resize() {

        if (!this.needResize) return;
        
        this.tools.map((data)=>{
            const {renderer, camera} = data
            renderer.setSize(this.size.w, this.size.h)

            if(camera){
                camera.aspect = this.size.r;
                camera.updateProjectionMatrix();
            }

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

            if( data.type !== 'color' ) this.helper.visible = false
            else if( this.withHelper ) this.helper.visible = true

            if( data.type === 'lines' ){ 
                const currentAutoClear = data.renderer.autoClear;
                const camera = this.VIEWS3 && !this.fixCamers ? data.camera : this.camera
    
                data.renderer.clear( true, true, true );

                //this.scene.matrixWorldAutoUpdate = false;
                //this.scene.background = null;
                
                this.scene.overrideMaterial = Outline;
                data.renderer.render( this.scene, camera );

                this.scene.overrideMaterial = Inline;
                data.renderer.render( this.scene, camera );

                this.scene.overrideMaterial = BlackAll;
                return data.renderer.render( this.scene, camera )

            }

            this.scene.overrideMaterial = !data.material ? null: data.material; 
            return data.renderer.render(this.scene, this.VIEWS3 && !this.fixCamers ? data.camera : this.camera)
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
            if(camera){
                camera.aspect = this.size.r;
                camera.updateProjectionMatrix();
            }
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
