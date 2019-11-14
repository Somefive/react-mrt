import _ from 'lodash'
import chroma from 'chroma-js'
import randomstring from 'randomstring'

export default class DataLayout {

    constructor(config, dataView) {
        this.__initConfig(config)
        this.__initAuxFunc()
        this.__initDataView(dataView)
        this.__initColors(this.ncols)

        this.__placeRoot(this.root, this.ncols)
        this.horizon = this.root.height + this.config.HorizonMarginTop
        this.__placeGrid(this.grid, this.eras, this.horizon)
        this.gradientY = this.grid[this.nrows-1].reduce((prev, cell) => Math.max(cell.y+cell.height, prev), 0)

        this.edges = this.__placeEdges(this.root, this.gridT, this.ncols, this.horizon)

        console.log(this.config, this.root, this.grid, this.eras)

        this.clusterLabelsHeight = _.max(this.clusterWords.map(words => words.length)) * this.config.BottomLabelTextLineHeight
        this.bottomY = this.grid[this.nrows-1].reduce((prev, cell) => 
            Math.max(prev, cell.pins.length > 0
                ? _.max(cell.pins.map(pin => 
                    pin.y + ((pin.fullTextPieces.length - 1) * this.config.CellTextLineHeight + pin.abstractPieces.length * this.config.CellTextSecondaryLineHeight) * 2
                ))
                : 0
        ), this.gradientY + this.clusterLabelsHeight + this.config.BottomLabelTextLineHeight * 3)
        this.clusterBottomLabels = this.__placeClusterBottomLabels(this.gradientY + this.clusterLabelsHeight, this.clusterWords)
        this.clusterTopLabels = this.__placeClusterTopLabels(this.gridT, this.clusterNames)
        this._width = this.config.CellWidth * this.ncols
        this.__initBackgroundColors(this.grid, this.gradientY, this.bottomY)
        this.__placeLinks(this.papers)
    }

    __initConfig(config) {
        config.CellOrbmentOffsetX = config.CellPaddingLeft + config.CellOrbmentRadius
        config.CellOrbmentOffsetY = config.CellPaddingTop + config.CellOrbmentRadius
        config.CellTextOffsetX = config.CellOrbmentOffsetX + config.CellOrbmentRadius + config.CellTextLeadMargin
        config.CellTextOffsetY = config.CellOrbmentOffsetY
        config.CellWidth = config.CellTextOffsetX + config.CellTextWidth + config.CellPaddingRight
        config.CellTextExpandWidth = config.CellTextWidth + config.CellWidth
        this.config = config
    }

    __initDataView(dataView) {
        this.grid = dataView.grid
        this.gridT = dataView.gridT
        this.eras = dataView.eras
        this.root = dataView.root
        this.ncols = dataView.ncols
        this.nrows = dataView.nrows
        this.clusterWords = dataView.clusterWords
        this.clusterNames = dataView.clusterNames
        this.papers = dataView.papers
    }

    __initAuxFunc() {
        this.cellTextWidth = (span) => ((span - 1) * this.config.CellWidth + this.config.CellTextWidth)
        this.nodeTextFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextSecondaryFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextSecondaryFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextCustomizeFold = (text, span, fontSize) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (fontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
    }

    __initColors(ncols) {
        // This is slow
        this.rootColor = chroma.scale()(0.5)
        this.rootTextColor = chroma(this.rootColor).darken().hex()
        this.headerBackgroundColor = chroma(this.rootColor).luminance(0.9)
        this.clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(Math.floor(ncols / 2))
        this.branchColors = _.range(0, ncols).map(j => chroma(this.clusterColors[Math.floor(j / 2)]).luminance(j % 2 === 0 ? 0.25 : 0.5))
        this.branchTextColors = this.branchColors.map(color => chroma(color).darken().hex())
        this.clusterTopLabelColors = this.clusterColors.map(color => chroma(color).luminance(0.5).darken(2))
        this.authorColor = chroma("grey").luminance(0.3).hex()
        this.defs = []
    }

    __initBackgroundColors(grid, gradientY, bottomY) {
        // This is particularly slow
        const nrows = grid.length
        this.backgroundSolidColors = this.clusterColors.map(color => chroma(color).luminance(0.9))
        this.backgroundTextSolidColors = this.clusterColors.map(color => chroma(color).luminance(0.7))
        this.backgroundGradientSolidColors = this.clusterColors.map((color, idx) => {
            const x = grid[nrows-1][idx*2].x
            return this.gradientColor(chroma(color).luminance(0.9), "white", x, gradientY, x, bottomY)
        })
        this.backgroundSelectionColors = this.clusterColors.map(color => chroma(color).luminance(0.5))
        this.backgroundTextSelectionColors = this.clusterColors.map(color => chroma(color).luminance(0.2))
        this.backgroundGradientSelectionColors = this.clusterColors.map((color, idx) => {
            const x = grid[nrows-1][idx*2].x
            return this.gradientColor(chroma(color).luminance(0.5), "white", x, gradientY, x, bottomY)
        })
    }

    gradientColor(from, to, x1, y1, x2, y2) {
        const id = randomstring.generate(8)
        this.defs.push({id, from, to, x1, y1, x2, y2})
        return `url('#${id}')`
    }

    __placeRoot(root, ncols) {
        root.x = this.config.CellWidth * (ncols - 1) / 2 + this.config.CellOrbmentOffsetX
        root.y = this.config.CellOrbmentOffsetY
        root.expandable = true
        root.span = ncols / 4
        root.fullSpan = ncols / 4
        root.color = this.rootColor
        root.textColor = this.rootTextColor
        root.fontSize = this.config.CellTextFontSize * 1.5
        root.secondaryFontSize = this.config.CellTextSecondaryFontSize * 1.5
        root.lineHeight = this.config.CellTextLineHeight * 1.5
        root.secondaryLineHeight = this.config.CellTextSecondaryLineHeight * 1.5
        root.pins = [{...root, 
            x: root.x,
            y: root.y,
            cell: root,
            textPieces: this.nodeTextCustomizeFold(root.text, root.span, root.fontSize), 
            fullTextPieces: this.nodeTextCustomizeFold(root.text, root.fullSpan, root.fontSize),
            abstractPieces: this.nodeTextCustomizeFold(root.abstract, root.fullSpan, root.secondaryFontSize),
        }]
        root.textWidth = this.cellTextWidth(root.span)
        root.fullTextWidth = this.cellTextWidth(root.fullSpan)
        root.pins[0].height = root.pins[0].textPieces.length * this.config.CellTextLineHeight
        const _y = root.y + root.pins[0].height + this.config.CellTextMargin
        root.height = Math.max(
            _y - this.config.CellTextOffsetY - root.y + this.config.CellPaddingBottom,
            this.config.CellPaddingTop + 2 * this.config.CellOrbmentRadius + this.config.CellPaddingBottom
        )
    }

    __placeGrid(grid, eras, horizon) {
        const ncols = grid[0].length
        let y = horizon + this.config.HorizonMarginBottom
        grid.forEach((row, i) => {
            eras[i].y = y
            row.forEach((cell, j) => {
                let _y = y + this.config.CellTextOffsetY
                cell.x = this.config.CellWidth * j + this.config.CellOrbmentOffsetX
                cell.y = _y
                cell.color = this.branchColors[j]
                cell.textColor = this.branchTextColors[j]
                // if (cell.pins.length === 0) return
                cell.expandable = (j+1 < ncols)
                    && (cell.pins.length > 0)
                    && (row[j+1].pins.length === 0)
                    && (!this.config.disableTextBranchSpan)
                    && (!this.config.DisableTextClusterSpan || j % 2 === 0)
                cell.span = cell.expandable ? 2 : 1
                cell.fullSpan = (j+1 < ncols) ? 2 : 1
                cell.pins.forEach(pin => {
                    pin.x = cell.x
                    pin.y = _y
                    pin.textPieces = this.nodeTextFold(pin.text, cell.span)
                    pin.fullTextPieces = this.nodeTextFold(pin.text, cell.fullSpan)
                    pin.abstractPieces = this.nodeTextSecondaryFold(pin.abstract, cell.fullSpan)
                    pin.height = pin.textPieces.length * this.config.CellTextLineHeight
                    _y += pin.height + this.config.CellTextMargin
                })
                cell.overlayed = j > 0 && row[j-1].expandable
                cell.textWidth = this.cellTextWidth(cell.span)
                cell.fullTextWidth = this.cellTextWidth(cell.fullSpan)
                cell.fontSize = this.config.CellTextFontSize
                cell.secondaryFontSize = this.config.CellTextSecondaryFontSize
                cell.lineHeight = this.config.CellTextLineHeight
                cell.secondaryLineHeight = this.config.CellTextSecondaryLineHeight
                cell.top = cell.y - this.config.CellTextLineHeight - this.config.CellTextLineHeight
                cell.bottom = _y
                cell.right = this.config.CellWidth * j + this.config.CellTextOffsetX + cell.textWidth
                cell.height = Math.max(
                    _y - this.config.CellTextOffsetY - y + this.config.CellPaddingBottom,
                    this.config.CellPaddingTop + 2 * this.config.CellOrbmentRadius + this.config.CellPaddingBottom
                )
            })
            eras[i].height = row.reduce((prev, cell) => Math.max(prev, cell.height), 0)
            y += eras[i].height
        })
    }

    __placeEdges(root, gridT, ncols, horizon) {
        const edges = []
        const addEdge = (x1, y1, x2, y2, color) => edges.push({x1, y1, x2, y2, color})
        const addVerticalEdge = (x, y1, y2, color) => addEdge(x, y1, x, y2, color)
        const addHorizontalEdge = (x1, x2, y, color) => addEdge(x1, y, x2, y, color)
        {
            const cell = root, cellLeft = gridT[0][0], cellRight = gridT[ncols - 2][0]
            addVerticalEdge(cell.x, cell.y, horizon, this.rootColor)
            addHorizontalEdge(cellLeft.x, cellRight.x, horizon, this.rootColor)
        }
        gridT.forEach((branch, branchID) => {
            const _branch = branch.filter(cell => cell.pins.length > 0)
            if (_branch.length === 0 && branchID % 2 === 1) return
            const startEra = (branchID % 2 === 0) ? 0 : _branch[0].eraID
            let endEra = (_branch.length > 0) ? _branch[_branch.length-1].eraID : 0
            if (branchID % 2 === 0) {
                const _nextBranch = gridT[branchID+1].filter(cell => cell.pins.length > 0)
                if (_nextBranch.length > 0) endEra = Math.max(endEra, _nextBranch[0].eraID)
            }
            for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
                let cell = branch[eraID]
                const yStart = cell.overlayed ? cell.top : cell.y
                cell = branch[eraID-1]
                let sib = branchID > 0 ? gridT[branchID-1][eraID-1] : null
                const yEnd = cell.overlayed ? sib.bottom : cell.y
                addVerticalEdge(cell.x, yStart, yEnd, cell.color)
            }
            if (branchID % 2 === 0) {
                const cell = branch[0]
                const yEnd = cell.overlayed ? cell.top : cell.y
                addVerticalEdge(cell.x, horizon, yEnd, this.gradientColor(this.rootColor, cell.color, cell.x, horizon, cell.x, yEnd))
            } else {
                const cell = branch[startEra]
                const sib = gridT[branchID-1][startEra]
                const yEnd = cell.top
                const yStart = cell.y
                addVerticalEdge(cell.x, yStart, yEnd, cell.color)
                addHorizontalEdge(cell.x, sib.x, yEnd, this.gradientColor(cell.color, sib.color, cell.x, yEnd, sib.x, yEnd))
            }
        })
        return edges
    }

    __placeClusterBottomLabels(y, clusterWords) {
        // const clusterLabelsHeight = _.max(clusterWords.map(pieces => pieces.length)) * this.config.BottomLabelTextLineHeight
        return clusterWords.map((pieces, clusterID) => pieces.reverse().map((word, idx) => { return {
            word,
            x: clusterID * 2 * this.config.CellWidth + this.config.CellPaddingLeft + this.config.CellOrbmentRadius,
            y: y - idx * this.config.BottomLabelTextLineHeight
        }}))
    }

    __placeClusterTopLabels(gridT, clusterNames) {
        return _.range(0, gridT.length , 2).map(idx => {
            const branch = gridT[idx]
            const _branch = branch.filter(cell => cell.pins.length > 0)
            const _sibBranch = gridT[idx+1].filter(cell => cell.pins.length > 0)
            const color = this.clusterTopLabelColors[Math.floor(idx / 2)]
            if (_branch.length === 0 && _sibBranch.length === 0) return {x: 0, y: 0, color, text: ""}
            const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
                (_sibBranch[0].y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) :
                (_branch[0].y - this.config.CellTextLineHeight)) - this.config.TopLabelTextLineHeight / 2
            const x = branch[0].x + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
            const text = clusterNames[Math.floor(idx / 2)]
            return {x, y, color, text}
        })
    }

    __placeLink(p1, p2) {
        const y1 = p1.y, y2 = p2.y
        const x1 = (p1.x < p2.x && p1.cell.right <= p2.x) ? p1.cell.right : p1.x, x2 = (p2.x < p1.x && p2.cell.right <= p1.x) ? p2.cell.right : p2.x 
        const mx = (p1.x < p2.x && p1.cell.right <= p2.x) ? (p1.cell.right + this.config.CellPaddingRight) : (p1.x - this.config.CellPaddingLeft - this.config.CellOrbmentRadius)
        let d = `M ${x1} ${y1}`
        if (y1 === y2) d += ` L ${x2} ${y2}`
        else d += ` C ${mx} ${y1}, ${mx} ${y1}, ${mx} ${(y1+y2)/2} S ${mx} ${y2}, ${x2} ${y2}`
        return { src: p1, tgt: p2, d }
    }

    __placeLinks(papers) {
        const links = {references: {}, citations: {}}
        _.forEach(papers, (src, pid) => {
            links.references[pid] = []
            links.citations[pid] = []
        })
        _.forEach(papers, (src, pid) => {
            src.references.forEach(rid => {
                const ref = papers[rid]
                if (!ref) return
                links.references[pid].push(this.__placeLink(src, ref))
                links.citations[rid].push(this.__placeLink(ref, src))
        })})
        this.links = links
    }

}