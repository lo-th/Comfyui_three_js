import * as THREE from "./three.module.js";

// 3D MODEL
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from './jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from './jsm/libs/meshopt_decoder.module.js';
import { FBXLoader } from './jsm/loaders/FBXLoader.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import { STLLoader } from './jsm/loaders/STLLoader.js';
// IMAGE
import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import { EXRLoader } from './jsm/loaders/EXRLoader.js';

export const Pool = {

	renderer:null,
	manager: new THREE.LoadingManager(),

	loader:{

		gltf:null,
		fbx:null,
		obj:null,
		stl:null,

		hdr:null,
		exr:null,

	},

	getLoader( type ){

		if(type==='gltf') type = 'glb';
		if(Pool['l_' + type]) return Pool['l_' + type]();

	},

	l_exr(){
		if(Pool.loader.exr === null ) Pool.loader.exr = new EXRLoader( Pool.manager );
		return Pool.loader.exr;
	},

	l_hdr(){
		if(Pool.loader.hdr === null ) Pool.loader.hdr = new RGBELoader( Pool.manager );
		return Pool.loader.hdr;
	},

	l_obj(){
		if(Pool.loader.obj === null ) Pool.loader.obj = new OBJLoader( Pool.manager );
		return Pool.loader.obj;
	},

	l_fbx(){
		if(Pool.loader.fbx === null ) Pool.loader.fbx = new FBXLoader( Pool.manager );
		return Pool.loader.fbx;
	},

	l_stl(){
		if(Pool.loader.stl === null ) Pool.loader.stl = new STLLoader( Pool.manager );
		return Pool.loader.stl;
	},

	l_glb(){
		if(Pool.loader.gltf === null ){
			const dracoPath = new URL(`./jsm/libs/draco/gltf/`, import.meta.url);
	        const dracoLoader = new DRACOLoader().setDecoderPath( dracoPath.href )
	        dracoLoader.setDecoderConfig({ type: 'js' });

	        const ktx2Path = new URL(`./jsm/libs/basis/`, import.meta.url);
	        const ktx2Loader = new KTX2Loader().setTranscoderPath( ktx2Path.href )

	        Pool.loader.gltf = new GLTFLoader( Pool.manager )
	        .setCrossOrigin('anonymous')
	        .setDRACOLoader(dracoLoader)
	        .setKTX2Loader(ktx2Loader.detectSupport(Pool.renderer))
			.setMeshoptDecoder(MeshoptDecoder);
		}
		return Pool.loader.gltf;
	}

}