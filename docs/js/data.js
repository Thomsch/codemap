"use strict";
// Import and preprocessing
let args4jData;

let sampleData = ({
    nodes: Array.from({length:13}, () => ({})),
    links: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 0 },
      { source: 1, target: 3 },
      { source: 3, target: 2 },
      { source: 3, target: 4 },
      { source: 4, target: 5 },
      { source: 5, target: 6 },
      { source: 5, target: 7 },
      { source: 6, target: 7 },
      { source: 6, target: 8 },
      { source: 7, target: 8 },
      { source: 9, target: 4 },
      { source: 9, target: 11 },
      { source: 9, target: 10 },
      { source: 10, target: 11 },
      { source: 11, target: 12 },
      { source: 12, target: 10 }
    ]
})

function processHierarchy(json){

    const classNames = json.classNames

    let hierarchy = classNames.map(fqnClassName => {
        let parent = getPackage(fqnClassName);
        
        // Remove parents that are classes until we find a package.
        while (isClass(parent)) {
            parent = getPackage(parent)
        }
        
        console.log(fqnClassName)
        console.log(parent)

        let ret = {
            name: fqnClassName,
            parent: parent
        }

        return ret
    });

    hierarchy.push({
        name: "org.kohsuke.args4j",
        parent: ""
    })    
    
    hierarchy.push({
        name: "org.kohsuke.args4j.spi",
        parent: "org.kohsuke.args4j"
    })
    
  return hierarchy
}

function processMethodData(json) {
    const classData = json.classData

    let nodes = classData.flatMap(itemClass => {
        return itemClass.methods.flatMap(itemMethod => ({
            id: itemMethod.signature,
            name: itemMethod.name,
            class: getShortName(itemClass.className),
        }));
    });

    let links = classData.flatMap(itemClass => {
        return itemClass.methods.flatMap(itemMethod => {
            return itemMethod.calls.flatMap(callee => ({
                // source: Math.floor(Math.random() * nodes.length),
                source: nodes.findIndex(x => x.id === itemMethod.signature),
                // target: Math.floor(Math.random() * nodes.length),
                target: nodes.findIndex(x => x.id === callee.signature),
            }));
        });
    });

    return { nodes: nodes, links: links}
}

// Transform JSON to flat representations: nodes, links, hierarchy
function processJson({ classData, classNames }) {

//   console.log({ classData })

    let classNodes = classData.map(item => ({
        fqn: item.className,
        name: getShortName(item.className),
        type: "class"
    }));

    let methodNodes = classData.flatMap(itemClass => {
        return itemClass.methods.flatMap(itemMethod => ({
            fqn: itemMethod.signature,
            class: getShortName(itemClass.className),
            name: itemMethod.name,
            type: 'method'
        }));
    });

    let nodes = methodNodes;
//   let nodes = classNodes.concat(methodNodes)

    let methodLinks = classData.flatMap(itemClass => {
        return itemClass.methods.flatMap(itemMethod => {
            return itemMethod.calls.flatMap(callee => ({
                source: itemMethod.signature, //getMethodFqn(itemClass.className, itemMethod.name),
                target: callee.signature,
                // TODO: type is actually superfluous since we can just check if
                // the source and target are currently visible
                // but this incurs more performance issues so...
                type: 'method'
            }));
        });
    });

    let links = methodLinks

    let methodContainers = classData.flatMap(itemClass => {
        return itemClass.methods.flatMap(itemMethod => ({
            parent: itemClass.className,
            child: itemMethod.signature, //getMethodFqn(itemClass.className, itemMethod.name),
            type: 'method'
        }));
    });

    let classContainers = classNames.map(fqnClassName => {
        let parent = getPackage(fqnClassName);

        // Remove parents that are classes until we find a package.
        while (isClass(parent)) {
            parent = getPackage(parent)
        }

        return {
            parent: parent,
            child: fqnClassName,
            type: 'class'
        }
    });

    let hierarchy = methodContainers.concat(classContainers);

    // add extra links about classes
    let classLinks = [];
    methodLinks.map(ml => {
        let sourceClass = methodContainers.find(m => m.child == ml.source);
        let targetClass = methodContainers.find(m => m.child == ml.target);
        if (targetClass == undefined || sourceClass == undefined) return;
        classLinks.push({ source: sourceClass.parent, target: targetClass.parent, type: 'class' })
    })

    classLinks = Array.from(new Set(classLinks));

    // add extra package links
    let packageLinks = [];
    classLinks.map(ml => {
        let sourcePkg = classContainers.find(m => m.child == ml.source);
        let targetPkg = classContainers.find(m => m.child == ml.target);
        if (sourcePkg == undefined || targetPkg == undefined) return;
        packageLinks.push({ source: sourcePkg.parent, target: targetPkg.parent, type: 'class' })
    })

    links = links.concat(classLinks).concat(packageLinks);

    console.log({ nodes })
    console.log({ links })
    console.log({ hierarchy })

//   return { nodes: nodes, links: links, hierarchy: hierarchy, classNames: classNames }
}

// Converts a Fully Qualified Name to a short name
// e.g., org.animals.Poodle -> Poodle
function getShortName(fullQualifiedName) {
    let res = fullQualifiedName.split('.'); // There might be a more efficient way to do this.
    return res[res.length - 1] // Return the last element, which is the class name.
}

// Converts a fully qualified class name and method name to a method FQN.
function getMethodFqn(classFqn, methodName) {
    return classFqn + "." + methodName + "()";
}

function getPackage(classFqn) {
    return classFqn.substring(0, classFqn.lastIndexOf("."))
}

// Verifies if a FQN is a class or a package. Returns true if it's a class.
function isClass(classFqn) {
    let splitFqn = classFqn.split('.');
    let maybeAClass = splitFqn[splitFqn.length - 1]; // The last element is either a package or a class.
    return maybeAClass.charCodeAt(0) >= 65 && maybeAClass.charCodeAt(0) <= 90
    // Alternate implementation: look if the candidate is an element of data.classNames. Set operations are O(1).
}

// Adapted from earlier prototype: https://github.com/amyjzhu/503-hacking/