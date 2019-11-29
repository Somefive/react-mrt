import React from 'react'
import { Carousel } from 'antd'
import _ from 'lodash'
import './helper.css'
import texts from './helper-text.json'

export default class Helper extends React.Component {
    render() {
        const lang = this.props.lang || "en"
        const images = _.range(1, 9).map(index => `https://raw.githubusercontent.com/Somefive/react-mrt/master/src/components/toolbox/images/guide${index}.jpg`) 
        return (
            <Carousel className="helper" autoplay>{ images.map((img, idx) => {
                return <div className="helper-tab" key={idx}>
                    <img alt={texts[idx]["title"][lang]} src={img}/>
                    <div className="helper-content">
                        <h3>{texts[idx]["title"][lang]}</h3>
                        <p>{texts[idx]["description"][lang]}</p>
                    </div>
                </div>
            })}</Carousel>
        )
    }
}