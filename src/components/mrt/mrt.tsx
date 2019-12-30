import * as React from 'react';
import './mrt.css';
import MRTViewer from '../viewer';
import { IMRTData } from '../../model/mrtTree';

interface IState {

}

interface IProps {
    data: IMRTData;
}

export default class MRT extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {

        }
    }

    public render() {
        console.log("data: ", this.props.data);
        const {data} = this.props;
        return (
            <div className='_mrt'>
                <MRTViewer data={data}></MRTViewer>
            </div>
        )
    }
}