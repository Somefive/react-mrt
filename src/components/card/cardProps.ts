import { IMRTNode } from "../../model/mrtTree";

export default interface ICardProps {
    left: number;
    top: number;
    node: IMRTNode;
    nodeDiv: HTMLDivElement;
    die: boolean;
    onClose: (node: IMRTNode) => void;
}