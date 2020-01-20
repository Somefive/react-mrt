class Vector {
    private data: number[]
    constructor(data: number[]) {
        this.data = data
    }
    public length(): number {
        return this.data.length
    }
    static DotProduct(v1: Vector, v2: Vector): number {
        const length = v1.length()
        if (length !== v2.length() || length === 0) throw new Error(`vector length invalid: v1(${length}) v2(${v2.length()})`)
        let sum = 0
        for (let i = 0; i < length; ++i) sum += v1.data[i] * v2.data[i];
        return sum
    }
}

export {
    Vector
}