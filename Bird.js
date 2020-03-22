import React, { Component } from "react";
import { Animated } from "react-native";
// import Images from './assets/Images';

export default class Bird extends Component {
    constructor(props) {
        super(props);

        this.animatedValue = new Animated.Value(this.props.body.velocity.y);
    }

    birds = [
        require('./assets/img/bird1.png'),
        require('./assets/img/bird2.png'),
        require('./assets/img/bird3.png'),
    ]
    dark_birds = [
        require('./assets/img/bird_black1.png'),
        require('./assets/img/bird_black2.png'),
        require('./assets/img/bird_black3.png'),
    ]


    render() {
        const width = this.props.body.bounds.max.x - this.props.body.bounds.min.x;
        const height = this.props.body.bounds.max.y - this.props.body.bounds.min.y;
        const x = this.props.body.position.x - width / 2;
        const y = this.props.body.position.y - height / 2;

        this.animatedValue.setValue(this.props.body.velocity.y);
        let rotation = this.animatedValue.interpolate({
            inputRange: [-10, 0, 10, 20],
            outputRange: ['-20deg', '0deg', '15deg', '45deg'],
            extrapolate: 'clamp'
        })
        let variable = this.props.theme == 'dark' ? 'dark_birds' : 'birds';

        let image = this[variable][this.props.pose - 1];

        return (

            <Animated.Image
                key={this.props.pose}
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: width,
                    height: height,
                    transform: [{ rotate: rotation }]
                }}
                resizeMethod="scale"
                resizeMode="stretch"
                fadeDuration={0}
                //resizeMode="stretch"
                source={image}
                defaultSource={image} />
        );
    }
}
