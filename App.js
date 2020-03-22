import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    TouchableOpacity,
    Image,
    Modal,
    AsyncStorage,
    Switch,
    Vibration
} from 'react-native';
import Matter from 'matter-js';
import { GameEngine } from 'react-native-game-engine';
import Bird from './Bird';
import Floor from './Floor';
import Physics, { resetPipes } from './Physics';
import Constants from './Constants';

import {
    AdMobBanner,
    AdMobInterstitial
} from 'react-native-admob'


import Sound from 'react-native-sound';

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            running: false,
            score: null,
            maxScore: 0,
            theme: 'dark'
        };

        this.gameEngine = null;

        this.entities = this.setupWorld();
        this.sound = new Sound(require('./sound/background.wav'));
    }




    componentDidMount() {

        AdMobInterstitial.setAdUnitID('ca-app-pub-3408462666302033/7134915414');

        this.showAd = () => AdMobInterstitial.requestAd().then(() =>
            AdMobInterstitial.showAd()
        );

        AsyncStorage.getItem('maxScore', (result) => {
            this.setState({ maxScore: result ? JSON.parse(result) : 0 });
        });
    }



    setupWorld = () => {
        let engine = Matter.Engine.create({ enableSleeping: false });
        let world = engine.world;
        world.gravity.y = 0.0;

        let bird = Matter.Bodies.rectangle(
            Constants.MAX_WIDTH / 2,
            Constants.MAX_HEIGHT / 2,
            Constants.BIRD_WIDTH,
            Constants.BIRD_HEIGHT,
        );

        let floor1 = Matter.Bodies.rectangle(
            Constants.MAX_WIDTH / 2,
            Constants.MAX_HEIGHT - 25,
            Constants.MAX_WIDTH + 4,
            50,
            { isStatic: true },
        );

        let floor2 = Matter.Bodies.rectangle(
            Constants.MAX_WIDTH + Constants.MAX_WIDTH / 2,
            Constants.MAX_HEIGHT - 25,
            Constants.MAX_WIDTH + 4,
            50,
            { isStatic: true },
        );

        Matter.World.add(world, [bird, floor1, floor2]);
        Matter.Events.on(engine, 'collisionStart', event => {
            var pairs = event.pairs;

            this.gameEngine.dispatch({ type: 'game-over' });
        });

        return {
            physics: { engine: engine, world: world },
            floor1: { body: floor1, renderer: Floor },
            floor2: { body: floor2, renderer: Floor },
            bird: { body: bird, pose: 1, renderer: Bird, theme: this.state.theme },
        };
    };

    onEvent = e => {
        if (e.type === 'game-over') {
            this.showAd();
            Vibration.vibrate(5000);
            // Alert.alert("Game Over", `Sua pontuação foi de ${this.state.score}`);
            if (this.state.score > this.state.maxScore) {
                this.setState({ maxScore: this.state.score }, _ => {
                    AsyncStorage.setItem('maxScore', JSON.stringify(this.state.maxScore));
                });
            }
            this.setState({ running: false });
        } else if (e.type === 'score') {
            Vibration.vibrate(1000);

            this.setState({
                score: this.state.score + 1,
            });
        }
    };

    reset = () => {
        resetPipes();
        this.gameEngine.swap(this.setupWorld());
        this.setState({
            running: true,
            score: 0,
        });
    };

    componentDidUpdate(prev, pos) {
        if (pos.running != this.state.running) {

            if (this.state.running) {

                this.sound.play();
                this.sound.setNumberOfLoops(-1);
            } else {
                this.sound.stop();
            }
        }
    }

    worldRender = [
        require('./assets/img/background.png'),
        require('./assets/img/background2.png'),
    ]

    render() {
        let { score, running, maxScore } = this.state;
        return (
            <View style={styles.container}>
                <Image
                    source={this.worldRender[this.state.theme == 'dark' ? 1 : 0]}
                    style={styles.backgroundImage}
                    resizeMode="stretch"
                />

                <GameEngine
                    ref={ref => {
                        this.gameEngine = ref;
                    }}
                    style={styles.gameContainer}
                    systems={[Physics]}
                    running={running}
                    onEvent={this.onEvent}
                    entities={this.entities}>

                    {/* <StatusBar hidden={true} /> */}
                </GameEngine>



                <Start
                    visible={!running && score == null}
                    theme={this.state.theme}
                    changeTheme={_ => this.setState({ theme: this.state.theme == 'dark' ? 'light' : 'dark' })}
                    onStart={_ => this.setState({ score: 0, running: true })}
                />
                <View
                    style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                    }}>
                    <View style={{ width: '50%', alignItems: 'center' }}>
                        <Text style={{ ...styles.score, fontSize: 15 }}>Pontuação</Text>
                        <Text style={styles.score}>{score}</Text>
                    </View>
                    <View style={{ width: '50%', alignItems: 'center' }}>
                        <Text style={{ ...styles.score, fontSize: 15 }}>
                            Pontuação mais alta
            </Text>

                        <Text style={styles.score}>{maxScore}</Text>
                    </View>
                </View>

                <GameOver theme={this.state.theme} changeTheme={_ => this.setState({ theme: this.state.theme == 'dark' ? 'light' : 'dark' })} visible={!running && score != null} onClose={this.reset} />

                <View style={{ bottom: 0 }}>
                    <AdMobBanner
                        adSize="largeBanner"
                        adUnitID="ca-app-pub-3408462666302033/6336839065"
                        testDevices={[AdMobBanner.simulatorId]}
                        onAdFailedToLoad={error => console.warn(error)}
                    />

                </View>
            </View>
        );
    }
}

let Start = React.memo(({ onStart, visible, theme, changeTheme }) => {
    return (
        <Modal visible={visible}>
            <View style={styles.fullScreenButton}>
                <View style={styles.fullScreen}>
                    <Text style={{ ...styles.score, color: 'white', position: 'relative' }}>Flapy Dark</Text>
                    <TouchableOpacity
                        onPress={onStart}
                        style={{
                            width: '80%',
                            height: '5%',
                            margin: 10,
                            backgroundColor: 'red',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 25,
                            elevation: 20
                        }}>
                        <View>
                            <Text style={{ ...styles.gameOverSubText, textAlign: 'center', textShadowOffset: { height: 20, width: 20 }, textShadowColor: 'white', textShadowRadius: 20 }}>
                                Iniciar
              </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{
                        width: '80%',
                        height: 50,
                        margin: 10,
                        backgroundColor: 'blue',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                    }}>
                        <Text style={{ ...styles.gameOverSubText, textAlign: 'center', textShadowOffset: { height: 20, width: 20 }, textShadowColor: 'white', textShadowRadius: 20 }}>Tema</Text>
                        <Switch value={theme == 'dark'} onValueChange={changeTheme} />
                    </View>
                    {/* <TouchableOpacity
                        style={{
                            width: '80%',
                            height: '5%',
                            margin: 10,
                            backgroundColor: 'blue',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <View>
                            <Text style={{ ...styles.gameOverSubText, textAlign: 'center' }}>
                                Scores
              </Text>
                        </View>
                    </TouchableOpacity> */}
                    {/* <Text style={styles.gameOverSubText}>Try Again</Text> */}
                </View>
            </View>
        </Modal>
    );
});

let GameOver = React.memo(({ onClose, visible, theme, changeTheme }) => {
    return (
        <Modal visible={visible}>
            <TouchableOpacity style={styles.fullScreenButton} onPress={onClose}>
                <View style={styles.fullScreen}>
                    <Text style={styles.gameOverText}>Fim de Jogo </Text>
                    <Text style={styles.gameOverSubText}>Tentar Novamente</Text>
                </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <AdMobBanner
                    adSize="banner"
                    adUnitID="ca-app-pub-3408462666302033/4797215047"
                    testDevices={[AdMobBanner.simulatorId]}
                    onAdFailedToLoad={error => console.warn(error)}
                />

                <View style={{
                    width: '80%',
                    height: 50,
                    margin: 10,
                    backgroundColor: 'blue',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row'
                }}>
                    <Text style={{ ...styles.gameOverSubText, textAlign: 'center', textShadowOffset: { height: 20, width: 20 }, textShadowColor: 'white', textShadowRadius: 20 }}>Tema</Text>
                    <Switch value={theme == 'dark'} onValueChange={changeTheme} />
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: Constants.MAX_WIDTH,
        height: Constants.MAX_HEIGHT,
    },
    gameContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    gameOverText: {
        color: 'white',
        fontSize: 48,
        fontFamily: '04b_19',
    },
    gameOverSubText: {
        color: 'white',
        fontSize: 24,
        fontFamily: '04b_19',
    },
    fullScreen: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'black',
        opacity: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    score: {
        position: 'absolute',
        color: 'white',
        fontSize: 72,
        // top: 50,
        // left: Constants.MAX_WIDTH / 2 - 20,
        textShadowColor: '#444444',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
        fontFamily: '04b_19',
    },
    fullScreenButton: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flex: 1,
    },
});
