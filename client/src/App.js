import React, { Component } from "react";
import Pusher from "pusher-js";
import format from "date-fns/format";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    const urlParams = new URLSearchParams(window.location.search);
    const isUserAuthorized = urlParams.has("authorized") ? true : false;

    this.state = {
      isUserAuthorized,
      musicHistory: [],
    };
  }

  componentDidMount() {
    const { isUserAuthorized } = this.state;

    if (isUserAuthorized) {
      fetch(`https://statsify-backend.onrender.com/history`)
        .then((res) => res.json())
        .then((data) => {
          this.setState({ musicHistory: data });
        })
        .catch((error) => console.log(error));

      const pusher = new Pusher(`${process.env.REACT_APP_PUSHER_KEY}`, {
        cluster: `${process.env.REACT_APP_PUSHER_CLUSTER}`,
        encrypted: true,
      });

      const channel = pusher.subscribe("spotify");
      channel.bind("update-history", (data) => {
        this.setState((prevState) => {
          const arr = data.musicHistory
            .map((item) => {
              const isPresent = prevState.musicHistory.find(
                (e) => e.played_at === item.played_at
              );
              if (isPresent === undefined) {
                return item;
              } else {
                return null;
              }
            })
            .filter(Boolean);
          return {
            musicHistory: arr.concat(prevState.musicHistory),
          };
        });
      });
    }
  }

  render() {
    const { isUserAuthorized, musicHistory } = this.state;
    const connectSpotify = isUserAuthorized ? (
      ""
    ) : (
      <a href="https://statsify-backend.onrender.com/login">
        Connect your Spotify account
      </a>
    );

    const TableItem = (item, index) => (
      <tr key={item.played_at}>
        <td>{index + 1}</td>
        <td>{item.track_name}</td>
        <td>{format(item.played_at, "D MMM YYYY, hh:mma")}</td>
      </tr>
    );

    const RecentlyPlayed = () => (
      <div className="recently-played">
        <h2>Recent Tracks</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Song title</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>{musicHistory.map((e, index) => TableItem(e, index))}</tbody>
        </table>
      </div>
    );

    return (
      <div className="App">
        <header className="header">
          <h1>Spotify Listening History</h1>
          <p>View your music history in realtime with Spotify</p>

          {connectSpotify}
          {musicHistory.length !== 0 ? <RecentlyPlayed /> : null}
        </header>
      </div>
    );
  }
}

export default App;
