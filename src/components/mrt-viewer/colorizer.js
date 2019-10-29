import chroma from 'chroma-js'
import _ from 'lodash'
import randomstring from 'randomstring'

export default class Colorizer {
    constructor(grid) {
        const ncols = grid[0].length
        this.__generateRootColor()
        this.__generateClusterColors(ncols)
        this.__generateBranchColors(ncols)
        this.defs = []
    }

    __generateRootColor() {
        this.ROOT = {}
        this.ROOT.STROKE = chroma.scale()(0.5)
        this.ROOT.BACKGROUND = chroma(this.ROOT.STROKE).luminance(0.9)
    }

    __generateClusterColors(ncols) {
        const __colors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(Math.floor(ncols / 2))
        this.CLUSTERS = __colors.map((color, idx) => {
            const STROKE = color
            const LABEL = chroma(color).luminance(0.5).darken(2)
            const BACKGROUND = {
                UNSELECTED: {
                    SOLID: chroma(color).luminance(0.9),
                    TEXT: chroma(color).luminance(0.7),
                    // GRADIENT: this.gradientColor(chroma(color).luminance(0.9), "white", 0, _height, 0, _height+extendedHeight)
                },
                SELECTED: {
                    SOLID: chroma(color).luminance(0.5),
                    TEXT: chroma(color).luminance(0.2),
                    // GRADIENT: this.gradientColor(chroma(color).luminance(0.5), "white", 0, _height, 0, _height+extendedHeight)
                },
            }
            return { STROKE, BACKGROUND, LABEL }
        })
    }

    __generateBranchColors(ncols) {
        this.BRANCHES = _.range(0, ncols).map((_, j) => {
            const STROKE = chroma(this.CLUSTERS[Math.floor(j / 2)].STROKE).luminance(j % 2 === 0 ? 0.25 : 0.5)
            return { STROKE }
        })
    }

    gradientColor(from, to, x1, y1, x2, y2) {
        const id = randomstring.generate(8)
        this.defs.push({id, from, to, x1, y1, x2, y2})
        return `url('#${id}')`
    }

}