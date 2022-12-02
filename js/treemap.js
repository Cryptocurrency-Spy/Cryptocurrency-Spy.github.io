class Treemap {

    constructor() {
        this.svg = d3.select("#treemap")
            .on('mouseover', e => {
                let mouseX = e.clientX;
                let mouseY = e.clientY;
                let et = e.target
                // console.log(mouseX, mouseY)
                d3.select('#treemap_tooltip')
                    .attr('visibility', 'visible')
                    .attr('transform', 'translate(' + (mouseX-10) + ',' + (mouseY-50) + ')')
            })
            .on('mouseout', e => {
                d3.select('#treemap_tooltip')
                    .attr('visibility', 'visible')
            })

        this.tooltip = d3.select("#treemap_tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style('background-color', 'white')
            .style('width', 200)
            .style('height', 100)
            .style('font-size', "24px")
            .attr('class', 'nice-font')

        this.width = this.svg.attr("width")
        this.height = this.svg.attr("height");

        this.format = d3.format(",d");

        this.treemap = d3.treemap()
            .tile(d3.treemapBinary)
            //treemapBinary,treemapDice,treemapSlice,treemapSliceDice,treemapSquarify(default),d3.treemapResquarify
            .size([this.width, this.height])
            .round(true)
            .padding(7)


        this.parsedData = globalObj.parsedData;
        this.draw_treemap();

        // this.attachTreemapBrush()
    }

    // attachTreemapBrush() {
    //     this.brushGroup = d3.select('#tree_brush_group')  // g
    //         // .attr('transform', 'translate(' + this.dx + ',' + this.dy + ')')
    //
    //     this.brush = d3.brush().extent([
    //         [0, 0],
    //         [this.width, this.height]
    //     ])
    //         // .on("start", e => this.brushstart(e))
    //         // .on("brush", e => this.brushed(e))
    //         .on("end", e => this.brushend(e))
    //
    //     this.brushg = this.brushGroup.append('g')
    //         .call(this.brush)
    // }
    //
    // brushend(e) {
    //     let s = e.selection
    //     let [[x0, y0], [x1, y1]] = s
    //     console.log(s)
    //
    //     crop(x0, y0, 0, 0, this.width, this.height)
    //     crop(x1, y1, 0, 0, this.width, this.height)
    //     function crop(x, y, x_min, y_min, x_max, y_max) {
    //         if (x < x_min) {
    //             x = x_min
    //         }
    //         if (y < y_min) {
    //             y = y_min
    //         }
    //         if (x > x_max) {
    //             x = x_max
    //         }
    //         if (y > y_max) {
    //             y = y_max
    //         }
    //     }
    //
    //
    // }



    draw_treemap() {
        // console.log(globalObj.selectedTime)

        this.final_time = d3.max(globalObj.selectedTime)
        this.start_time = d3.min(globalObj.selectedTime)

        let final_data = this.parsedData.filter(d => d.month === `${this.final_time}`)
        let start_data = this.parsedData.filter(d => d.month === `${this.start_time}`)

        this.final_date = d3.max(final_data.map(d => d.date))
        this.start_date = d3.min(start_data.map(d => d.date))

        final_data = final_data.filter(d => (d.date === this.final_date))
        start_data = start_data.filter(d => (d.date === this.start_date))

        final_data.push({
            name: "a",
            cap: "",
        })
        final_data = final_data.map(d => {
            d.cap = d.cap * 1.0;
            d.cap0 = 0;
            for (let data of start_data) {
                if (data.name === d.name) {
                    // console.log(d.name)
                    d.cap0 = data.cap * 1.0;
                }
            }
            d.change = d.cap - d.cap0
            return d;
        })
        // this._data = _data

        // let map_from_name = d3.group(final_data, d => d.name);

        this.root = d3.stratify()
            .id(d => d.name)
            .parentId(d => d.name === "a" ? null : "a")
            (final_data)
            .sum(d => d.cap)//create value properties in each node
            .sort((a, b) => b.height - a.height || b.value - a.value)

        this.treemap(this.root)

        this.cell = this.svg.select('#cell_group').selectAll("a")
            .data(this.root.leaves())
            .join("a")
            .selectAll("g")
            .data(d => [d])
            .join("g")
            .attr("target", "_blank")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

        this.hidden_rects = []

        let changes = final_data.map(d => d.change)
        this.max_changes = d3.max(changes)
        this.min_changes = d3.min(changes)
        this.scale_change = d3.scaleDiverging()
            .domain([this.min_changes, 0, this.max_changes])
            .interpolator(d3.interpolateRdYlGn)

        this.rectangles = this.cell.selectAll("rect")
            .data(d => {
                let _d = d;
                _d.selected = false;
                return [_d];
            })
            .join("rect")
            .attr("id", d => d.id)
            .attr('aaa', d => {
                if (d.x1 - d.x0 < d.id.length * 10) { // mark small rectangles
                    this.hidden_rects.push(d.id)
                }
            })
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)

            .attr("fill", d => this.scale_change(d.data.change))
            .style("stroke-width", "5px")
            .attr('checked', false)
            .on('click', e => {
                globalObj.updateGlobalNameSelection(e);
                // globalObj.name_select.checkboxes.attr("checked", false)
            })
            .on("mouseover", e => {
                this.tooltip.style("visibility", "visible");
                let et = e.target
                d3.select(et)
                    .attr('fill', d => globalObj.colorScale(d.id))
            })
            .on("mousemove", e => {
                // console.log(e.clientX, e.clientY)
                let et = e.target
                this.tooltip
                    .style("top", (e.clientY-5)+"px")
                    .style("left",(e.clientX+5)+"px")
                    .style('color', globalObj.colorScale(et.id))
                    .text(et.id + " " + this.format(et.__data__.value))
            })
            .on("mouseout", e => {
                this.tooltip.style("visibility", "hidden")
                let et = e.target
                d3.select(et)
                    .attr("fill", d => this.scale_change(d.data.change))
            });


        // texts
        this.texts = this.cell.selectAll('text')
            .data(d => [d])
            .join("text")
            .attr("x", d => 0.05 * (d.x1 - d.x0))
            .attr("y", d => 0.50 * (d.y1 - d.y0))
            .style('font-size', "32px")
            .attr('class', 'nice-font')
            .text(d => d.id)
            .style('fill', 'black')
            // hide texts in too-small rectangle
            .attr('visibility', d => this.hidden_rects.includes(d.id)? 'hidden': 'visible')


        d3.select('#color1').style('stop-color', this.scale_change(this.min_changes))
        d3.select('#color2').style('stop-color', this.scale_change(this.max_changes))

        this.drawLegend()
    }

    drawLegend() {
        let legend = d3.select('#gradient_rect')
            .attr('width', '40%')
            .attr('height', '100%')
            .attr('fill', 'url(#color-gradient)')
            .attr('transform', 'translate(' + 60 + ', 0)')
        const f = d3.format(".2s");
        d3.select('#label_1')
            .attr('class', 'label')
            .attr('transform', 'translate(' + 30 + ', ' + 20 + ')')
            .text(f(this.max_changes))
        d3.select('#label_2')
            .attr('class', 'label')
            .attr('transform', 'translate(' + 210 + ', ' + 20 + ')')
            .text(f(this.min_changes))
    }

    updateTreeRectStatus() {
        // console.log(globalObj.selectedNames)
        this.rectangles
            .style("stroke", d => (globalObj.selectedNames.includes(d.id))? "black": "none")
    }

    // do not delete this
    // updateNameSelectionByTreemap(e) {
    //     let et = e.target;
    //     let name = et.getAttribute('id')
    //     let checkbox = globalObj.name_select.checkboxes
    //         .filter(d => (d === name))
    //         .node()
    //     checkbox.click()
    //     // this.triggerMouseEvent(checkbox, "click");
    // }
    //
    // triggerMouseEvent (node, eventType) {
    //     let event = new Event(eventType, {bubbles : true, cancelable: true});
    //     node.dispatchEvent(event);
    // }
}