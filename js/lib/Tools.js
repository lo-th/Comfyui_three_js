import {
	Float32BufferAttribute
} from './three.module.js';


export const Tools = {

	MorphModel:{},

	reset:() => {
		Tools.MorphModel = {}
	},

	getMesh:( scene ) => {
        let meshs = {};

        scene.traverse( ( child ) => {
            if ( child.isMesh ) meshs[ child.name ] = child;
        })
        return meshs;

    },

    autoShadow:( scene ) => {

        scene.traverse( ( child ) => {
            if ( child.isMesh ){
            	child.receiveShadow = true;
                child.castShadow = true;
            }
        })

    },

    // SKINNING

    autoSkinning( model ){

    	let haveSkinning = false;

    	model.traverse( ( child ) => {
            if ( child.isMesh ){
            	if(child.skeleton) haveSkinning = true;
            }
        })

        return haveSkinning;

    },


    // MORPH

    setMorph:( obj, name, value )=>{
        if(!obj.morphTargetInfluences) return
		if(obj.morphTargetDictionary[name] === undefined ) return
		obj.morphTargetInfluences[ obj.morphTargetDictionary[name] ] = value;
    },

	autoMorph: ( model, normal = true, relative = false ) => {

		let haveMorph = false;
		const meshs = Tools.getMesh( model );

    	let morph = {};
    	let tmpMesh = [];

        model.traverse( ( node ) => { 
            if ( node.isMesh && node.name.search('__M__') !== -1){ 
            	morph[ node.name ] = node.geometry;
            	tmpMesh.push(node);
            }
        })

		let oName, tName, target, id, g, gm, j, dp, dn, ar, m;
		
		for ( let name in morph ){

			oName = name.substring( 0, name.indexOf('__') )
            tName = name.substring( name.lastIndexOf('__') + 2 );

            target = meshs[ oName ];
            if(!Tools.MorphModel[oName]){
            	Tools.MorphModel[oName] = target;
            	/*target.prototype.setMorph = function(name, value){
            		if(!this.morphTargetInfluences) return
			        if(this.morphTargetDictionary[name] === undefined ) return
			        this.morphTargetInfluences[ this.morphTargetDictionary[name] ] = value;
            	}*/
            }
            

			if( target ){

				if(!target.userData.morph) target.userData.morph = {}

				g = target.geometry;
				gm = morph[name];

				g.morphTargetsRelative = relative;

				if( g.attributes.position.count === gm.attributes.position.count ){

					if( !g.morphAttributes.position ){
                        g.morphAttributes.position = [];
                        if( normal ) g.morphAttributes.normal = [];
                        target.morphTargetInfluences = [];
                        target.morphTargetDictionary = {};
                    }

                    id = g.morphAttributes.position.length;

                    // position
                    if( relative ){
                        j = gm.attributes.position.array.length;
                        ar = []; 
                        while(j--) ar[j] = gm.attributes.position.array[j] - g.attributes.position.array[j]
                        dp = new Float32BufferAttribute( ar, 3 );
                    } else {
                        dp = new Float32BufferAttribute( gm.attributes.position.array, 3 );
                    }

                    g.morphAttributes.position.push( dp );

                    // normal
                    if( normal ){
                        dn = new Float32BufferAttribute( gm.attributes.normal.array, 3 );
                        g.morphAttributes.normal.push( dn );
                    }

                    target.morphTargetInfluences.push(0)
                    target.morphTargetDictionary[ tName ] = id;
                    target.userData.morph[tName] = 0;
                    haveMorph = true;
                    

				} else {
					console.warn( 'Morph '+ tName + ' target is no good on ' + target.name )
				}

			}

		}

		morph = {}

		// claer garbege
		j = tmpMesh.length
		while(j--){
            m = tmpMesh[j]
			if( m.parent ) m.parent.remove( m );
			if( m.geometry ) m.geometry.dispose()
			//if( m.material ) m.material.dispose()
			
		}

		return haveMorph;

	},

}