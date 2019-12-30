// import MRT from './mrt'
import MRT from './components/mrt/mrt';
import { IMRTData, IMRTColumn, IMRTBlock, IMRTNode } from './model/mrtTree';
import { IPersonNode, defaultPersonNode } from './model/nodes/personNode';
import { IPaperNode, defaultPaperNode } from './model/nodes/paperNode';
import { ITextNode, defaultTextNode } from './model/nodes/textNode';
import OMRT from './mrt';

export { 
    OMRT,
    MRT,
    IMRTBlock,
    IMRTNode,
    IMRTData,
    IMRTColumn,
    IPersonNode,
    defaultPersonNode,
    IPaperNode,
    defaultPaperNode,
    ITextNode,
    defaultTextNode
}