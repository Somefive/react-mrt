import * as React from 'react';
import ICardProps from '../cardProps';
import './paperCard.less';
import { IPaperNode } from '../../..';

interface IState {
    left: number;
    top: number;
    height: number;
    unfold: boolean;
    abstractAll: boolean;
}

interface IProps extends ICardProps {

}

export default class PaperCard extends React.Component<IProps, IState> {
    private _div: HTMLDivElement;
    private _oldParent: (Node & ParentNode) | null;
    private _oldStyle: CSSStyleDeclaration;
    private _bgDiv: HTMLDivElement;
    private _node: IPaperNode;

    private _detailsDiv: HTMLDivElement | null;

    private _width: number;
    private _bgColor: string;
    private _abstractLimit: number;

    private _unfoldTimer: NodeJS.Timeout | null;

    constructor(props: IProps) {
        super(props);
        this.state = {
            left: this.props.left,
            top: this.props.top,
            height: 140,
            unfold: false,
            abstractAll: false
        }

        this._div = this.props.nodeDiv;
        this._oldStyle = {...this.props.nodeDiv.style};
        this._oldParent = this.props.nodeDiv.parentNode;
        this._node = this.props.node as IPaperNode;

        this._div.style.zIndex = "1";

        this._width = 425;
        this._bgColor = "#fff";
        this._abstractLimit = 200;

        this.handleClose = this.handleClose.bind(this);
        this.getAbstract = this.getAbstract.bind(this);
        this.handleMore = this.handleMore.bind(this);
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

    private getAbstract(): JSX.Element {
        if(this._node.abstract.length < this._abstractLimit + 6 || this.state.abstractAll) {
            return <span>{this._node.abstract}</span>;
        }else {
            let index: number = this._node.abstract.indexOf(" ", this._abstractLimit);
            let short: string = this._node.abstract.substr(0, index);
            return <span>{short}<a href='#' onClick={this.handleMore}>...more</a></span>;
        }
    }

    private handleMore(): boolean {
        this.setState({abstractAll: true});
        return false;
    }

    public componentDidMount(): void {
        this._div.style.left = "3%";
        this._div.style.top = "12px";
        this._div.style.width = `94%`;
        this._div.style.transform = "scale(1)";
        this._div.style.animationName = "titleStart";
        this._div.style.animationDuration = "0.2s";
        this._div.style.fontSize = "18px";
        this._div.style.userSelect = "none";
        this._div.style.cursor = "pointer";
        this._div.style.textDecoration = "underline";
        this._div.onclick = () => {
            this.setState({unfold: !this.state.unfold, abstractAll: false});
        }
        this._bgDiv.appendChild(this._div);

        let height: number = this._div.offsetHeight + 40;
        let left: number = Math.min(this.props.globalWidth - this._width, this.state.left);
        this.setState({height, left});

        this._unfoldTimer = setTimeout(() => {
            this._unfoldTimer = null;
            if(!this.state.unfold) {
                this.setState({unfold: true});
            }
        }, 500);
    }

    public componentDidUpdate(preProps: IProps): void {
        if(!preProps.die && this.props.die) {
            setTimeout(() => {
                this.handleClose();
            }, 200);
        }
        let height: number = this._div.offsetHeight + 40 + (this._detailsDiv ? this._detailsDiv.offsetHeight : 0);
        if(height != this.state.height) {
            this.setState({height});
        }
    }

    public componentWillUnmount(): void {
        clearTimeout(this._unfoldTimer!);
        this.giveBack();
    }

    public render() {
        const {height, unfold, left, top} = this.state;
        const abstractOffsetY: number = this._div.offsetHeight + this._div.offsetTop + 10;
        return (
            <div className='papercard' 
                ref={d => this._bgDiv = d!} 
                style={{
                    position: "absolute", 
                    left: `${left}px`,
                    top: `${top}px`, 
                    width: `${this._width}px`, 
                    height: `${height}px`,  
                    backgroundColor: this._bgColor}} >
                {
                    unfold ? (
                        <div ref={d => this._detailsDiv = d} className='papercard_detail' style={{top: abstractOffsetY}}>
                            { this._node.year && <div><b>Year: </b>{this._node.year}</div> }
                            <div><b>Citations: </b>{this._node.citations || 0}</div>
                            { this._node.venue && <div><b>Venue: </b>{this._node.venue}</div> }
                            { this._node.abstract && <div style={{maxHeight: '160px', overflowY: "scroll"}}><b>Abstract: </b>{this.getAbstract()}</div> }
                        </div>
                    ) : null
                }
            </div>
        )
    }
}