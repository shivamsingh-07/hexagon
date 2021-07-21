import { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function Room({ auth }) {
    const space = io.connect(`${process.env.REACT_APP_API_URL}/room`);
    const [match, setMatch] = useState({});
    const [message, setMessage] = useState("");
    const [vetoStatus, setVetoStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const { roomID } = useParams();
    const history = useHistory();
    let ID;

    useEffect(
        () =>
            (async () => {
                try {
                    await axios.get(`${process.env.REACT_APP_API_URL}/room/` + roomID, { withCredentials: true }).then(response => {
                        setMatch(response.data);
                    });
                } catch (err) {
                    setMessage(err.response.data.error);
                    history.push("/");
                }
            })(),
        []
    );

    useEffect(() => {
        if (typeof match.roomID === "undefined") return;
        let difference = new Date(parseInt(match.timer) + 300000).getTime() - new Date().getTime();
        if (difference <= 0) return history.push("/dashboard");

        let team;
        if (
            match.team_1.some((user, index, array) => {
                return user.steamID === auth.steamID64;
            })
        )
            team = "Team_" + match.captain_1.name;
        else team = "Team_" + match.captain_2.name;

        space.emit("joinRoom", { room: roomID, team });

        setLoading(false);
        if (match.map.length > 1) setVetoStatus(true);
        else setVetoStatus(false);
    }, [match]);

    useEffect(() => {
        if (typeof vetoStatus === null) return;

        if (vetoStatus) {
            document.getElementById("loader").hidden = true;
            document.getElementById("veto").hidden = false;
            document.getElementById("status").innerText = "Veto Time";
        }
    }, [vetoStatus]);

    const vetoStart = epoch => {
        ID = setInterval(() => {
            let distance = new Date(epoch).getTime() - new Date().getTime();
            let minutes =
                Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) < 10
                    ? Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) < 0
                        ? "00"
                        : "0" + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                    : Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            let seconds =
                Math.floor((distance % (1000 * 60)) / 1000) < 10
                    ? Math.floor((distance % (1000 * 60)) / 1000) < 0
                        ? "00"
                        : "0" + Math.floor((distance % (1000 * 60)) / 1000)
                    : Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("clock").innerHTML = minutes + ":" + seconds;

            if (distance <= 0) {
                clearInterval(ID);
                if (match.map.length > 1) space.emit("randomMap", roomID);
                else vetoFinish({ map: match.map[0], connect: match.serverIP, countdown: parseInt(match.timer) });
            }
        }, 1000);
    };

    const vetoFinish = selected => {
        document.getElementById("logo").setAttribute("src", `/assets/images/${selected.map}.jpg`);
        if (selected.map === "de_cbble") selected.map = "de_cobblestone";
        document.getElementById("name").innerText = selected.map.slice(3).charAt(0).toUpperCase() + selected.map.slice(4);
        document.getElementById("url").value = "connect " + selected.connect;
        document.getElementById("connect").setAttribute("href", "steam://connect/" + selected.connect);
        document.getElementById("clock").hidden = false;
        document.getElementById("turn").hidden = true;
        document.getElementById("loader").hidden = true;
        document.getElementById("veto").hidden = true;
        document.getElementById("final").hidden = false;
        document.getElementById("status").innerText = "Time To Connect";
        document.getElementById("status").hidden = false;

        ID = setInterval(() => {
            let distance = new Date(selected.countdown + 300000).getTime() - new Date().getTime();
            let minutes =
                Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) < 10
                    ? Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) < 0
                        ? "00"
                        : "0" + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                    : Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            let seconds =
                Math.floor((distance % (1000 * 60)) / 1000) < 10
                    ? Math.floor((distance % (1000 * 60)) / 1000) < 0
                        ? "00"
                        : "0" + Math.floor((distance % (1000 * 60)) / 1000)
                    : Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("clock").innerHTML = minutes + ":" + seconds;

            if (distance <= 0) clearInterval(ID);
        }, 1000);
    };

    space.on("turn", user => {
        let map = document.querySelectorAll(".btn-close");
        if (user.name === auth.username && (user.name === match.captain_1.name || user.name === match.captain_2.name)) {
            document.getElementById("turn").innerText = "Your Turn";
            for (let i = 0; i < map.length; i++) map[i].style.visibility = "visible";
        } else document.getElementById("turn").innerText = "Your Opponent's Turn";
    });

    space.on("mapBanned", ban => {
        document.getElementById(ban).remove();
    });

    space.on("countdown", time => {
        clearInterval(ID);
        vetoStart(time);
    });

    space.on("mapSelected", selected => {
        clearInterval(ID);
        vetoFinish(selected);
    });

    space.on("loading", () => {
        document.getElementById("status").hidden = true;
        document.getElementById("clock").hidden = true;
        document.getElementById("turn").hidden = true;
        document.getElementById("loader").hidden = false;
        document.getElementById("veto").hidden = true;
    });

    const ban = id => {
        let map = document.getElementsByClassName("btn-close");
        for (let i = 0; i < map.length; i++) {
            map[i].style.visibility = "hidden";
        }
        space.emit("increment", roomID);
        space.emit("banMap", { room: roomID, map: id });
    };

    const copy = () => {
        const copyText = document.getElementById("url");
        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */
        document.execCommand("copy");
    };

    if (!loading)
        return (
            <div className="container text-center">
                <div className="box">
                    <section>
                        <h2 className="display-6">Team_{match.captain_1.name}</h2>
                        <br />
                        <br />
                        {match.team_1.map((player, index) => (
                            <div key={index}>
                                <img src={player.thumbnail} alt="" width="30px" />
                                &nbsp;&nbsp;
                                <a href={player.profile} target="_blank" rel="noreferrer" id="player_2">
                                    {player.name}
                                </a>
                                &nbsp;&nbsp;
                                <img src="https://img.icons8.com/color/24/000000/crown.png" alt="" hidden={index > 0} />
                            </div>
                        ))}
                    </section>
                    <section>
                        <span id="status"></span>
                        <br />
                        <span id="clock"></span>
                        <br />
                        <br />
                        <span id="turn"></span>
                        <br />
                        <div id="veto" hidden>
                            {match.map.map((map, index) => {
                                let name = map.slice(3).charAt(0).toUpperCase() + map.slice(4);
                                if (map === "de_cbble") name = "Cobblestone";
                                return (
                                    <div className="maps" id={map} key={index}>
                                        <img src={`/assets/images/${map}.jpg`} alt={map} />
                                        <span>{name}</span>
                                        <button type="button" className="btn-close" aria-label="Close" onClick={() => ban(map)}></button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="spinner-border" id="loader" role="status"></div>

                        <div id="final" hidden>
                            <div className="card" style={{ width: "18rem" }}>
                                <img className="card-img-top" alt="" id="logo" />
                                <div className="card-body">
                                    <h5 className="card-title" id="name"></h5>
                                    <br />
                                    <div className="input-group mb-3">
                                        <input type="text" className="form-control" id="url" readOnly />
                                        <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={() => copy()}>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                className="bi bi-clipboard"
                                                viewBox="0 0 16 16"
                                            >
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <br />
                                    <a type="button" id="connect" className="btn btn-primary">
                                        CONNECT TO SERVER
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section>
                        <h2 className="display-6">Team_{match.captain_2.name}</h2>
                        <br />
                        <br />
                        {match.team_2.map((player, index) => (
                            <div key={index}>
                                <img src={player.thumbnail} alt="" width="30px" />
                                &nbsp;&nbsp;
                                <a href={player.profile} target="_blank" rel="noreferrer" id="player_2">
                                    {player.name}
                                </a>
                                &nbsp;&nbsp;
                                <img src="https://img.icons8.com/color/24/000000/crown.png" alt="" hidden={index > 0} />
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        );
    else return <div className="spinner-border" id="loader" role="status"></div>;
}

export default Room;
