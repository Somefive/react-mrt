
interface IClusterInfo {
    level: number;
    x: number;
    y: number;
    width: number;
    levelMax: number;
    bgColor: string;
}

interface ILineInfo {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeWidth: number;
    stroke: string;
    opacity: number;
}

export {
    IClusterInfo,
    ILineInfo
}