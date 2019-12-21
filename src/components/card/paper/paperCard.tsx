import * as React from 'react';
import ICardProps from '../cardProps';
import './paperCard.less';
import { IPaperNode } from '../../..';

interface IState {
    height: number;
    unfold: boolean;
}

interface IProps extends ICardProps {

}

export default class PaperCard extends React.Component<IProps, IState> {
    private _div: HTMLDivElement;
    private _oldParent: (Node & ParentNode) | null;
    private _oldStyle: CSSStyleDeclaration;
    private _bgDiv: HTMLDivElement;
    private _node: IPaperNode;

    private _abstractDiv: HTMLDivElement | null;

    private _width: number;
    private _bgColor: string;

    constructor(props: IProps) {
        super(props);
        this.state = {
            height: 140,
            unfold: false
        }

        this._div = this.props.nodeDiv;
        this._oldStyle = {...this.props.nodeDiv.style};
        this._oldParent = this.props.nodeDiv.parentNode;
        this._node = this.props.node as IPaperNode;

        this._div.style.zIndex = "1";

        this._width = 425;
        this._bgColor = "#fff";

        this.handleClose = this.handleClose.bind(this);
    }

    private handleClose(): void {
        this.props.onClose(this.props.node);
    }

    private giveBack(): void {
        for(let key in this._oldStyle) {
            if(Number(key).toString() != key) {
                this._div.style[key] = this._oldStyle[key];
            }
        }
        this._div.onclick = null;
        if(this._oldParent) {
            this._oldParent.appendChild(this._div);
        }
    }

    public componentDidMount(): void {
        this._div.style.left = "6px";
        this._div.style.top = "12px";
        this._div.style.width = `${this._width-12}px`;
        this._div.style.transform = "scale(1)";
        this._div.style.animationName = "titleStart";
        this._div.style.animationDuration = "0.2s";
        this._div.style.fontSize = "18px";
        this._div.style.userSelect = "none";
        this._div.style.cursor = "pointer";
        this._div.style.textDecoration = "underline";
        this._div.onclick = () => {
            this.setState({unfold: !this.state.unfold});
        }
        this._bgDiv.appendChild(this._div);

        let height: number = this._div.offsetHeight + 80;
        this.setState({height});
    }

    public componentDidUpdate(preProps: IProps, preState: IState): void {
        if(!preProps.die && this.props.die) {
            setTimeout(() => {
                this.handleClose();
            }, 200);
        }
        if(preState.unfold != this.state.unfold) {
            let height: number = this._div.offsetHeight + 80 + (this._abstractDiv ? this._abstractDiv.offsetHeight : 0);
            this.setState({height});
        }
    }

    public componentWillUnmount(): void {
        this.giveBack();
    }

    public render() {
        const {height, unfold} = this.state;
        const abstractOffsetY: number = this._div.offsetHeight + this._div.offsetTop + 10;
        return (
            <div className='papercard' 
                ref={d => this._bgDiv = d!} 
                style={{
                    position: "absolute", 
                    left: `${this.props.left}px`,
                    top: `${this.props.top}px`, 
                    width: `${this._width}px`, 
                    height: `${height}px`,  
                    backgroundColor: this._bgColor}} >
                {
                    unfold ? (
                        <div ref={d => this._abstractDiv = d} className='papercard_abstract' style={{left: '6px', top: abstractOffsetY, width: `${this._width - 12}px`}}>{this._node.abstract}</div>
                    ) : null
                }
            </div>
        )
    }
}