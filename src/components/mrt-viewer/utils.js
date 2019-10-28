export function CalculateEras(years, eraMinRatio, lastEraRatio) {
    const t0 = window.performance.now()
    years.sort().reverse()
    let eras = []
    let _to = years[0]
    let _cnt = 1
    let eraMinSize = eraMinRatio * years.length
    let lastEraMinSize = lastEraRatio * years.length
    for (let i = 1; i < years.length; i++) {
        if (years[i] === years[i-1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) _cnt += 1
        else {
            eras.push({from: years[i-1], to: _to, cnt: _cnt})
            _to = years[i]
            _cnt = 1
        }
    }
    eras.push({from: years[years.length-1], to: _to, cnt: _cnt})
    console.log("cal eras: ", window.performance.now() - t0)
    return eras
}