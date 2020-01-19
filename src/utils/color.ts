import chroma from 'chroma-js'
import _ from 'lodash'

interface IColorTheme {
    src: string
    text: string
    main: string
    bgText: string
    bg: string
    bgMask: string
}

function generateColorTheme(src: string): IColorTheme {
    const color = chroma(src)
    return {src,
        text: color.luminance(0.25).darken(1).hex(),
        main: color.luminance(0.25).hex(),
        bgText: color.luminance(0.7).hex(),
        bg: color.luminance(0.9).hex(),
        bgMask: color.luminance(0.4).hex(),
    }
}

const palette: string[][] = [['Pink', 'LightPink', 'HotPink', 'DeepPink', 'PaleVioletRed', 'MediumVioletRed'],
['Aqua', 'Cyan', 'LightCyan', 'PaleTurquoise', 'Aquamarine', 'Turquoise', 'MediumTurquoise', 'DarkTurquoise', 'LightSeaGreen', 'CadetBlue', 'DarkCyan', 'Teal'],
['LightSalmon', 'Salmon', 'DarkSalmon', 'LightCoral', 'IndianRed', 'Crimson', 'Firebrick', 'DarkRed', 'Red'],
['Cornsilk', 'BlanchedAlmond', 'Bisque', 'NavajoWhite', 'Wheat', 'Burlywood', 'Tan', 'RosyBrown', 'SandyBrown', 'Goldenrod', 'DarkGoldenrod', 'Peru', 'Chocolate', 'SaddleBrown', 'Sienna', 'Brown', 'Maroon', 'Hex', 'Decimal'],
['OrangeRed', 'Tomato', 'Coral', 'DarkOrange', 'Orange'],
['Yellow', 'LightYellow', 'LemonChiffon', 'PapayaWhip', 'Moccasin', 'PeachPuff', 'PaleGoldenrod', 'Khaki', 'DarkKhaki', 'Gold'],
['DarkOliveGreen', 'Olive', 'OliveDrab', 'YellowGreen', 'LimeGreen', 'Lime', 'LawnGreen', 'Chartreuse', 'GreenYellow', 'SpringGreen', 'LightGreen', 'PaleGreen', 'DarkSeaGreen', 'MediumAquamarine', 'MediumSeaGreen', 'SeaGreen', 'ForestGreen', 'Green', 'DarkGreen'],
]


function generateColorThemes(n: number): IColorTheme[] {
    const srcColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(n)
    return srcColors.map(generateColorTheme)
}

export {
    IColorTheme,
    generateColorThemes
}