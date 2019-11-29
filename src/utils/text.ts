
let calcSpan: HTMLSpanElement;

function calcTextHeight(text: string, width: number, fontSize: number, lineHeight: number, fontFamily?: string): number {
    if(!calcSpan) {
        calcSpan = document.createElement("span");
        calcSpan.style.wordWrap = "break-word";
        calcSpan.style.wordBreak = "break-all";
        calcSpan.style.display = "inline-block";
        calcSpan.style.visibility = "hidden";
        document.body.appendChild(calcSpan);
    }
    calcSpan.style.width = `${width}px`;
    calcSpan.style.fontSize = `${fontSize}px`;
    calcSpan.style.lineHeight = `${lineHeight}px`;
    if(fontFamily) calcSpan.style.fontFamily = fontFamily;
    
    calcSpan.innerText = text;
    return calcSpan.offsetHeight;
}

export {
    calcTextHeight
}