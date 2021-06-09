"use strict";

function processHierarchy(json){

    const seed = 0.42;
    const source = d3.randomLcg(seed);
    const random = d3.randomNormal.source(source)(1, 0.75)

    const classNames = json.classNames

    let packages = new Set()
    let roots = new Set()

    let hierarchy = classNames.map(fqnClassName => {
        let parent = getPackage(fqnClassName);
        
        // Remove parents that are classes until we find a package.
        while (isClass(parent)) {
            parent = getPackage(parent)
        }

        packages.add(parent)

        let ret = {
            name: fqnClassName,
            code: getShortName(fqnClassName),
            weight: random(), // Simulate the number of lines of code, or size.
            parent: parent ? parent : "root"
        }

        return ret
    });

    packages.forEach(p => {

      if(p == "") return;

      let parent = getPackage(p);

      if(parent == "") {
        roots.add(p)
        return;
      }

      if(parent.indexOf(".") == -1) {
        roots.add(parent)
      }

      hierarchy.push({
        name: p,
        parent: parent
      })
    })

    if(roots.size > 1) {
      roots.forEach(r => {
        hierarchy.push({
          name: r,
          parent: "root"
        })
      })

      hierarchy.push({
        name: "root",
        parent: ""
      })
    }
    
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

    links = links.filter(link => link.target != -1)

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

// Part of the data processing code is adapted from our earlier prototype: https://github.com/amyjzhu/503-hacking/
