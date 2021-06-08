"use strict";

main();

async function main() {
    const jsonData = await d3.json("./data/midas.json"); 
    let classes = jsonData.classNames

    let classPackageHierarchy = processHierarchy(jsonData)
    visualizeHierachy(d3.select("#vis-macro"), classPackageHierarchy, classes);

    let data = processMethodData(jsonData);
    visualizeMethods(d3.select("#method-level"), data, classes)
}