"use strict";

main();

async function main() {
    const jsonData = await d3.json("./data/args4j.json"); 

    let classPackageHierarchy = processHierarchy(jsonData)
    visualizeHierachy(d3.select("#vis-macro"), classPackageHierarchy);

    let data = processMethodData(jsonData);
    // let data = sampleData;
    let classes = jsonData.classNames
    visualizeMethods(d3.select("#method-level"), data, classes)
}