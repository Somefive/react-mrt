import * as d3plus from 'd3plus-text'

export default class LocationManager {
    
    constructor(dataGrid, config) {
        this.dataGrid = dataGrid
        this.config = config 
    }

    gridPlacement(horizon) {
        const wrap = d3plus.textWrap()
            .fontSize(this.config.CellTextFontSize)
            .lineHeight(this.config.CellTextLineHeight)
            .width(this.config.CellTextWidth)
        let y = horizon
        return this.dataGrid.map(era => {
            const children = era.map((branch, idx) => {
                let _x = this.config.CellWidth * idx + this.config.CellTextOffsetX
                let _y = y + this.config.CellTextOffsetY
                const children = branch.map(paper => {
                    const segments = wrap(paper.text)
                    const height = segments.lines.length * this.config.CellTextLineHeight + this.config.CellTextMargin
                    const meta = { children: segments, x: _x, y: _y, height }
                    _y += height
                    return meta
                })
                const height = _y - this.config.CellTextOffsetY - y;
                return { children, x: _x, y: y, height }
            })
            const height = children.reduce((prev, cell) => Math.max(prev, cell.height), 0)
            const meta = { children, x: 0, y: y, height }
            y += height
            return meta
        })
    }

}