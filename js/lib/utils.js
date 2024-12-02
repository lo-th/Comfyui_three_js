export function $el( tag, propsOrChildren, children ) {
    const split = tag.split('.')
    const element = document.createElement(split.shift())
    if (split.length > 0) {
      element.classList.add(...split)
    }
  
    if (propsOrChildren) {
      if (typeof propsOrChildren === 'string') {
        propsOrChildren = { textContent: propsOrChildren }
      } else if (propsOrChildren instanceof Element) {
        propsOrChildren = [propsOrChildren]
      }
      if (Array.isArray(propsOrChildren)) {
        element.append(...propsOrChildren)
      } else {
        const {
          parent,
          $: cb,
          dataset,
          style,
          ...rest
        } = propsOrChildren
  
        if (rest.for) {
          element.setAttribute('for', rest.for)
        }
  
        if (style) {
          Object.assign(element.style, style)
        }
  
        if (dataset) {
          Object.assign(element.dataset, dataset)
        }
  
        Object.assign(element, rest)
        if (children) {
          element.append(...(Array.isArray(children) ? children : [children]))
        }
  
        if (parent) {
          parent.append(element)
        }
  
        if (cb) {
          cb(element)
        }
      }
    }
    return element
  }