import { IMRTNode } from "../mrtTree";

/**
 * 论文Node
 */
interface IPaperNode extends IMRTNode {
    /**
     * 论文标题
     */
    title: string;
    /**
     * 论文发表年份
     */
    year: number;
    /**
     * 出处
     */
    venue: string;
    /**
     * 被引用数
     */
    citations: number;
    /**
     * 
     */
    score: number;
}

const defaultPaperNode: IPaperNode = {
    type: "paper",
    id: "",
    name: "",
    link_in: [],
    link_out: [],
    title: "",
    year: 2000,
    venue: "",
    citations: 0,
    score: 0
}

export {
    IPaperNode,
    defaultPaperNode
}