import { IMRTNode } from "../mrtTree";

interface IPersonNode extends IMRTNode {
    /**
     * 照片
     */
    avatar: string;
    hindex: number;
    gindex: number;
    /**
     * 浏览量
     */
    viewed: number;
    /**
     * 从属
     */
    affiliation: string;
    /**
     * 职位
     */
    position: string;
}

const defaultPersonNode: IPersonNode = {
    type: "person",
    id: "",
    name: "",
    link_in: [],
    link_out: [],
    avatar: "",
    hindex: 0,
    gindex: 0,
    viewed: 0,
    affiliation: "",
    position: ""
}

export {
    IPersonNode,
    defaultPersonNode
}