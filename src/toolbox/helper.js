import React from 'react'
import { Carousel } from 'antd'
import img1 from './images/guide1.jpg'
import img2 from './images/guide2.jpg'
import img3 from './images/guide3.jpg'
import img4 from './images/guide4.jpg'
import img5 from './images/guide5.jpg'
import img6 from './images/guide6.jpg'
import img7 from './images/guide7.jpg'
import img8 from './images/guide8.jpg'
import './helper.css'
import texts from './helper-text.json'

export default class Helper extends React.Component {
    render() {
        const lang = this.props.lang || "en"
        const images = [img1, img2, img3, img4, img5, img6, img7, img8]
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