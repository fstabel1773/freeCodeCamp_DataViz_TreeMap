import * as d3 from "https://unpkg.com/d3?module";

const urlGames =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";

// get data
async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Not able to fetch the data. There was an error: ", error);
  }
}

const gamesData = await getData(urlGames);

// map data
const root = d3
  .hierarchy(gamesData)
  .sum((d) => (d.hasOwnProperty("value") ? d.value : 0))
  .sort((a, b) => b.value - a.value);

const platformsArray = root.children;
const platformNames = platformsArray.map((platform) => platform.data.name);

// color-scale
const colorHelper = d3
  .scaleSequential(d3.interpolateSpectral)
  .domain([0, platformsArray.length]);

const colors = platformsArray.map((platform, i) => colorHelper(i));
console.log(colors);
const colorScale = d3.scaleOrdinal().domain(platformsArray).range(colors);

// layout-variables
const width = 1200;
const height = 650;

const legendWidth = width / 3;
const legendColumnsCount = 3;
const legendColumnWidth = legendWidth / legendColumnsCount;
const legendRect = 15;
const legendSpacing = 10;

// tooltip
const tooltip = d3
  .select("body")
  .append("g")
  .attr("id", "tooltip")
  .style("opacity", 0);

const mouseenter = (event, d) => {
  tooltip.style("opacity", 0.9);
};

const mouseleave = (event, d) => {
  tooltip.transition().duration(500).style("opacity", 0);
};

const mousemove = (event, d) => {
  const [a, b] = d3.pointer(event);

  tooltip.transition().duration(200).style("opacity", 0.9);
  tooltip
    .attr("data-value", d.value)
    .html(
      `<p>Name: ${d.data.name}</p>
      <p>Category: ${d.data.category}</p>
      <p>Value: ${d.value}`
    )
    .style("left", a + 265 + "px")
    .style("top", b + 120 + "px");
};

// container
const container = d3.select("body").append("div").attr("class", "container");

// title and description
const header = container.append("div");
header
  .append("h1")
  .attr("x", 25)
  .attr("y", 25)
  .text("Video Game Sales")
  .attr("id", "title");
header
  .append("h4")
  .text("Top 100 Most Sold Video Games Grouped by Platform")
  .attr("id", "description");

// treemap-svg
const treemapSvg = container
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g");

// draw treemap
d3.treemap().size([width, height]).padding(3)(root);

treemapSvg
  .selectAll("rect")
  .data(root.leaves())
  .enter()
  .append("rect")
  .attr("class", "tile")
  .attr("x", (d) => d.x0)
  .attr("y", (d) => d.y0)
  .attr("width", (d) => d.x1 - d.x0)
  .attr("height", (d) => d.y1 - d.y0)
  .attr("data-name", (d) => d.data.name)
  .attr("data-category", (d) => d.data.category)
  .attr("data-value", (d) => d.value)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  .on("mouseenter", mouseenter)
  .style("stroke", "black")
  .style("fill", (d, i) => colorScale(d.data.category));

treemapSvg
  .selectAll("text")
  .data(root.leaves())
  .enter()
  .append("foreignObject")
  .attr("x", (d) => d.x0 + 5)
  .attr("y", (d) => d.y0 + 5)
  .attr("width", (d) => d.x1 - d.x0 - 10)
  .attr("height", (d) => d.y1 - d.y0 - 10)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  .on("mouseenter", mouseenter)
  .append("xhtml:div")
  .attr("class", "label")
  .html((d) => `<p>${d.data.name}</p>`);

// legend
const legend = container
  .append("svg")
  .attr("width", legendWidth)
  .attr(
    "height",
    (legendRect + legendSpacing) * (platformNames.length / legendColumnsCount)
  )
  .attr("id", "legend");

legend
  .selectAll("rect")
  .data(platformNames)
  .enter()
  .append("rect")
  .attr("class", "legend-item")
  .attr("width", legendRect)
  .attr("height", legendRect)
  .attr("transform", (d, i) => {
    const x = (i % legendColumnsCount) * legendColumnWidth;
    const y = Math.floor(i / legendColumnsCount) * (legendRect + legendSpacing);
    return `translate(${x}, ${y})`;
  })
  .style("fill", (d, i) => colorScale(d))
  .style("stroke", "black");

legend
  .selectAll(".legendLabel")
  .data(platformNames)
  .enter()
  .append("text")
  .attr("transform", (d, i) => {
    const x =
      (i % legendColumnsCount) * legendColumnWidth + legendRect + legendSpacing;
    const y =
      Math.floor(i / legendColumnsCount) * (legendRect + legendSpacing) +
      legendRect / 2;
    return `translate(${x}, ${y})`;
  })
  .text((d) => d)
  .attr("text-anchor", "left")
  .style("alignment-baseline", "central");
