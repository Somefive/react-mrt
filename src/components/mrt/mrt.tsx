import * as React from 'react';
import './mrt.css';
import MRTViewer from '../viewer';
import { IMRTTree } from '../../model/mrtTree';

interface IState {

}

interface IProps {
    data: IMRTTree;
    like?: boolean;
    lang?: string;
    userEdits?: any;
    authors?: string[];
    onLike: () => void;
    onLoadJson?: (json: any) => void;
    onEditChange?: (edits: any) => void;
}

export default class MRT extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {

        }
    }

    public render() {
        console.log("data: ", this.props.data);
        const data: IMRTTree = this.props.data;
        return (
            <div className='_mrt'>
                <MRTViewer data={data}></MRTViewer>
            </div>
        )
    }
}