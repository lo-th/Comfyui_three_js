let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

export class Hub {

    constructor() {

        const content = document.createElement( 'div' );
        content.style.cssText = 'position:absolute; top:10px; left:10px; width:24px; height:24px; border:1px solid white; pointer-events:auto; cursor: pointer;';// font-family: Mulish,sans-serif;z-index: 100000;
       
        this.content = content;
        this.ready = false;

    }

    add( dom ){

        if(!dom.parentElement) return
        if(this.ready) return
        dom.parentElement.appendChild( this.content );
        this.ready = true;

    }

}