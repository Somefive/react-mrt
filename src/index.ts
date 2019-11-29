// import MRT from './mrt'
import MRT from './components/mrt/mrt';
import { IMRTTree, IMRTBlock, IMRTNode } from './model/mrtTree';
import { IPersonNode, defaultPersonNode } from './model/nodes/personNode';
import { IPaperNode, defaultPaperNode } from './model/nodes/paperNode';
import OMRT from './mrt';

export { 
    OMRT,
    MRT,
    IMRTTree,
    IMRTBlock,
    IMRTNode,
    IPersonNode,
    defaultPersonNode,
    IPaperNode,
    defaultPaperNode
}