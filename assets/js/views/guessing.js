import { h, Component } from 'preact';
import TwitchVideoEmbed from '../components/twitch/embed.js';
import Guesses from '../components/guesses.js';
import Guesser from '../components/guesser.js';
import Controls from '../components/controls.js';
import {Socket} from 'phoenix';

export default class GuessView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      guesses: [],
      can_submit: false,
      game_state: null,
      input: {
        guess: ""
      }
    };
  }

  componentDidMount() {
    this.connectSocket();
  }

  componentWillUnmount() {
    this.channel.leave();
    this.socket.disconnect();
  }

  getSubmitStatus() {
    fetch("/api/can_submit",
      {
        method: "GET",
        credentials: "same-origin"
      })
      .catch(error => console.error("Error:", error))
      .then(response => response.json())
      .then(response => {
        let newState = Object.assign({}, this.state);
        newState.can_submit = response.can_submit;
        this.setState(newState);
      });
  }

  connectSocket() {
    this.socket = new Socket("/socket");
    this.socket.connect();

    this.channel = this.socket.channel("room:lobby");
    this.channel.join()
      .receive("ok", msg => this.gameState(msg.state, msg.guesses))
      .receive("error", msg => console.log("Unable to join", msg));
    this.channel.on("state", msg => this.gameState(msg.state, msg.guesses));
    this.channel.on("guess", this.gameGuess.bind(this));
  }

  gameGuess(guess) {
    let newState = Object.assign({}, this.state);
    newState.guesses.push(guess);
    this.setState(newState);
  }

  gameState(game_state, guesses) {
    let newState = Object.assign({}, this.state);
    newState.game_state = game_state;
    if (guesses) {
      newState.guesses = guesses;
    }
    if (game_state === "in_progress") {
      this.getSubmitStatus();
    }
    this.setState(newState);
  }

  submitGuess() {
    const value = this.state.input.guess;
    fetch(`/api/rounds/current/guess?value=${value}`,
      {
        method: "POST",
        credentials: "same-origin"
      })
      .catch(error => console.error("Error:", error))
      .then(response => {
        let newState = Object.assign({}, this.state);
        newState.input.guess = "";
        newState.can_submit = false;
        this.setState(newState);
      });
  }

  setInput(key, value) {
    let newState = Object.assign({}, this.state);
    newState.input[key] = value;
    this.setState(newState);
  }

  render(props, state) {
    return (
      <div class="row">
        <div class="col-xs-12 col-md-12 col-lg-8">
          <TwitchVideoEmbed channel="summoningsalt" />
        </div>
        <div class="col-xs-12 col-md-12 col-lg-4">
          <div class="row">
            <div class="col">
              { props.username && <Guesser
                submit={this.submitGuess.bind(this)}
                update={this.setInput.bind(this, "guess")}
                value={state.input.guess}
                disabled={!this.state.can_submit} /> }
              { props.username && props.moderator && <Controls
                  state={state.game_state}
                  channel={this.channel} /> }
              <Guesses guesses={state.guesses} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}