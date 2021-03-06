import { h } from 'preact';
import { Socket, Channel } from 'phoenix';

import TwitchVideoEmbed from '../components/twitch/embed';
import Flash from '../components/flash';
import Guesses from '../components/guesses';
import Guesser from '../components/guesser';
import Controls from '../components/controls';

import api from '../api';
import StoredComponent from 'stored-component';

type StateType = typeof defaultState;
type ChannelMsg = api.Guess | StateMsg;

interface StateMsg {
  state: api.State,
  guesses?: api.Guess[],
  winner?: string,
  correct?: string
}

interface PropsType {
  flash: Flash,
  username: string,
  can_control: boolean
}

const defaultState = {
  guesses: [] as api.Guess[],
  can_submit: false,
  game_state: "closed" as api.State,
  correct: "",
  input: {
    guess: ""
  }
};

export default class GuessView extends StoredComponent<PropsType, StateType> {
  channel: Channel<{}, {}, ChannelMsg>;
  socket: Socket<{}>;

  constructor(props) {
    super(props, defaultState);
  }

  componentDidMount() {
    this.connectSocket();
  }

  componentWillUnmount() {
    this.channel.leave();
    this.socket.disconnect();
  }

  getSubmitStatus() {
    api.can_submit().then(response => this.setState(response))
  }

  connectSocket() {
    this.socket = new Socket("/socket");
    this.socket.connect();

    this.channel = this.socket.channel("room:lobby");
    this.channel.join()
      .receive("ok", this.gameState.bind(this))
      .receive("error", () => this.props.flash.danger("Could not connect to guess channel."));
    this.channel.on("state", this.gameState.bind(this));
    this.channel.on("guess", this.gameGuess.bind(this));
  }

  /**
   * Callback for game guess websocket events.
   *
   * @param guess The websocket payload.
   */
  gameGuess(guess: api.Guess) {
    let newState = Object.assign({}, this.state);
    newState.guesses.push(guess);
    this.setState(newState);
  }

  /**
   * Callback for game state websocket events.
   *
   * @param msg The websocket payload.
   */
  gameState(msg: StateMsg) {
    let newState = Object.assign({}, this.state);
    newState.game_state = msg.state;
    if (msg.guesses) {
      newState.guesses = msg.guesses;
    }
    if (msg.winner) {
      this.props.flash.success(`${msg.winner} has guessed correctly with ${msg.correct}!`);
    }
    if (msg.correct) {
      newState.correct = msg.correct;
    }
    if (msg.state === "in_progress") {
      this.getSubmitStatus();
      newState.correct = "";
    }
    this.setState(newState);
  }

  submitGuess() {
    api.guess(this.state.input.guess)
      .then(() => {
        this.setState({
          input: {guess: ""},
          can_submit: false
        });
      });
  }

  /**
   * Generic input field update.
   *
   * @param key   The input field name.
   * @param value The field's value.
   */
  setInput(key: string, value: string) {
    let newState = Object.assign({}, this.state);
    newState.input[key] = value;
    this.setState(newState);
  }

  render(props: PropsType, state: StateType) {
    return (
      <div class="row">
        <div class="col-xs-12 col-md-12 col-lg-8">
          <TwitchVideoEmbed channel="summoningsalt" />
        </div>
        <div class="col-xs-12 col-md-12 col-lg-4">
          <div class="row">
            <div class="col">
              { !props.username &&
                <div class="alert alert-info" role="alert">
                  Please log in to participate.
                </div> }
              { props.username && <Guesser
                submit={this.submitGuess.bind(this)}
                update={this.setInput.bind(this, "guess")}
                value={state.input.guess}
                flash={props.flash}
                disabled={!this.state.can_submit} /> }
              { props.username && props.can_control && <Controls
                  state={state.game_state} /> }
              <Guesses guesses={state.guesses} correct={state.correct} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
