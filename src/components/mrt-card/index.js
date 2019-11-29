import React from 'react'
import './index.css'
import { Card, Icon, Skeleton } from 'antd' 

export default class MRTCard extends React.Component {
    render() {
        const title = <div className="title">{this.props.paper.title}</div>
        const description = this.props.paper.abstract
        const extra = <Icon className="close-button" type="close" onClick={() => this.props.onCardClose()}/>
        return (
            <div className="mrt-card" onDoubleClick={() => console.log('click')}>
                <Card
                    style={{ marginTop: 16 }}
                    actions={[
                        <Icon type="like"/>,
                        <Icon type="dislike"/>,
                        <Icon type="pull-request"/>,
                        <Icon type="share-alt"/>,
                    ]}
                    extra={extra}
                    title={title}
                >
                    <Card.Meta
                        description={description}
                    />
                </Card>
            </div>)
    }
}