"use strict";
// Import and preprocessing
let args4jData;

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
            weight: random(),
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

    console.log({links})

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

let globalEconomyJson = {
    "name": "world",
    "children": [
      {
        "name": "Asia",
        "color": "#f58321",
        "children": [
          {"name": "China", "weight": 14.84, "code": "CN"},
          {"name": "Japan", "weight": 5.91, "code": "JP"},
          {"name": "India", "weight": 2.83, "code": "IN"},
          {"name": "South Korea", "weight": 1.86, "code": "KR"},
          {"name": "Russia", "weight": 1.8, "code": "RU"},
          {"name": "Indonesia", "weight": 1.16, "code": "ID"},
          {"name": "Turkey", "weight": 0.97, "code": "TR"},
          {"name": "Saudi Arabia", "weight": 0.87, "code": "SA"},
          {"name": "Iran", "weight": 0.57, "code": "IR"},
          {"name": "Thaïland", "weight": 0.53, "code": "TH"},
          {"name": "United Arab Emirates", "weight": 0.5, "code": "AE"},
          {"name": "Hong Kong", "weight": 0.42, "code": "HK"},
          {"name": "Israel", "weight": 0.4, "code": "IL"},
          {"name": "Malasya", "weight": 0.4, "code": "MY"},
          {"name": "Singapore", "weight": 0.39, "code": "SG"},
          {"name": "Philippines", "weight": 0.39, "code": "PH"}
        ]
      },
      {
        "name": "North America",
        "color": "#ef1621",
        "children": [
          {"name": "United States", "weight": 24.32, "code": "US"},
          {"name": "Canada", "weight": 2.09, "code": "CA"},
          {"name": "Mexico", "weight": 1.54, "code": "MX"}
        ]
      },
      {
        "name": "Europe",
        "color": "#77bc45",
        "children": [
          {"name": "Germany", "weight": 4.54, "code": "DE"},
          {"name": "United Kingdom", "weight": 3.85, "code": "UK"},
          {"name": "France", "weight": 3.26, "code": "FR"},
          {"name": "Italy", "weight": 2.46, "code": "IT"},
          {"name": "Spain", "weight": 1.62, "code": "ES"},
          {"name": "Netherlands", "weight": 1.01, "code": "NL"},
          {"name": "Switzerland", "weight": 0.9, "code": "CH"},
          {"name": "Sweden", "weight": 0.67, "code": "SE"},
          {"name": "Poland", "weight": 0.64, "code": "PL"},
          {"name": "Belgium", "weight": 0.61, "code": "BE"},
          {"name": "Norway", "weight": 0.52, "code": "NO"},
          {"name": "Austria", "weight": 0.51, "code": "AT"},
          {"name": "Denmark", "weight": 0.4, "code": "DK"},
          {"name": "Ireland", "weight": 0.38, "code": "IE"}
        ]
      },
      {
        "name": "South America",
        "color": "#4aaaea",
        "children": [
          {"name": "Brazil", "weight": 2.39, "code": "BR"},
          {"name": "Argentina", "weight": 0.79, "code": "AR"},
          {"name": "Venezuela", "weight": 0.5, "code": "VE"},
          {"name": "Colombia", "weight": 0.39, "code": "CO"}
        ]
      },
      {
        "name": "Australia",
        "color": "#00acad",
        "children": [
          {"name": "Australia", "weight": 1.81, "code": "AU"}
        ]
      },
      {
        "name": "Africa",
        "color": "#f575a3",
        "children": [
          {"name": "Nigeria", "weight": 0.65, "code": "NG"},
          {"name": "Egypt", "weight": 0.45, "code": "EG"},
          {"name": "South Africa", "weight": 0.42, "code": "ZA"}
        ]
      },
      {
        "name": "Rest of the World",
        "color": "#592c94",
        "children": [
          {"name": "Rest of the World", "weight": 9.41, "code": "RotW"}
        ]
      }
    ]
  }
