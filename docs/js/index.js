"use strict";

main();

async function main() {
    const jsonData = await d3.json("./data/args4j.json"); 

    // let classPackageHierarchy = processHierarchy(jsonData)
    // visualizeHierachy(classPackageHierarchy);

    let data = processMethodData(jsonData);
    // let data = sampleData;
    let classes = jsonData.classNames
    visualizeMethods(data, classes)
}