class Network {

    constructor() {
        let width = 800;
        let height = 600;

        let svg = d3.select("#network")
            .attr('width', width)
            .attr('height', height);

        let color = d3.scaleOrdinal(d3.schemePaired);

        // Here we create our simulation, and give it some forces to apply
        //  to all the nodes:
        let simulation = d3.forceSimulation()
            // forceLink creates tension along each link, keeping connected nodes together
            .force("link", d3.forceLink().id(d => d.id)
                .strength(d => Math.sqrt(d.value))
            )
            // forceManyBody creates a repulsive force between nodes,
            //  keeping them away from each other
            .force("charge", d3.forceManyBody())
            // forceCenter acts like gravity, keeping the whole visualization in the
            //  middle of the screen
            .force("center", d3.forceCenter(width / 2, height / 2));


        let data = globalObj.parsedTransData
        let outputs = [...d3.group(data, d => d.target).keys()];
        let inputs = [...d3.group(data, d => d.source).keys()];


        outputs.push(inputs[0]);
        outputs = outputs.map(d => {
            return {id: d};
        });

        // First we create the links in their own group that comes before the node
        //  group (so the circles will always be on top of the lines)
        let linkLayer = svg.append("g")
            .attr("class", "links");
        // Now let's create the lines
        let links = linkLayer.selectAll("line")
            .data(data)
            .enter().append("line")
            .attr("stroke-width", d => Math.sqrt(d.value * 1e2));

        // Now we create the node group, and the nodes inside it
        let nodeLayer = svg.append("g")
            .attr("class", "nodes");
        let nodes = nodeLayer
            .selectAll("circle")
            .data(outputs)
            .enter().append("circle")
            .attr("r", 5)
            .attr("fill", d => "black")

            // This part adds event listeners to each of the nodes; when you click,
            //  move, and release the mouse on a node, each of these functions gets
            //  called (we've defined them at the end of the file)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // We can add a tooltip to each node, so when you hover over a circle, you
        //  see the node's id
        nodes.append("title")
            .text(d => d.id);

        // Now that we have the data, let's give it to the simulation...
        simulation.nodes(outputs);
        // The tension force (the forceLink that we named "link" above) also needs
        //  to know about the link data that we finally have - we couldn't give it
        //  earlier, because it hadn't been loaded yet!
        simulation.force("link")
            .links(data);

        // Finally, let's tell the simulation how to update the graphics
        simulation.on("tick", function () {
            // Every "tick" of the simulation will create / update each node's
            //  coordinates; we need to use those coordinates to move the lines
            //  and circles into place
            links
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            nodes
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });
        });


        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

    }
}