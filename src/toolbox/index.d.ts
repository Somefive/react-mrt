import * as React from 'react';

interface IProps {
    lang: string;
    like: boolean;
    hideSubBranch: boolean;
    disableTextClusterSpan: boolean;
    onLoadJson?: (json: any) => void;
    onDisableTextClusterSpan: () => void;
    onHideSubBranch: () => void;
    onLike: () => void;
    scaleFont: (larger: boolean) => void;
    zoom: (larger: boolean) => void;
    capture: (full: boolean) => void;
}

declare class Toolbox extends React.Component {
    props: IProps;
}

export {
    Toolbox
}