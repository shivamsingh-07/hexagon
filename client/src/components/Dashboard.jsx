import { useState } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

function Dashboard({ auth }) {
    const space = io.connect(`${process.env.REACT_APP_API_URL}/matchmaking`);
    const [name] = useState(auth.username);
    const [email] = useState(auth.email);
    const [verified] = useState(auth.verified);
    const [steamID] = useState(auth.steamID64);
    const [thumbnail] = useState(auth.thumbnail);
    const [profile] = useState(auth.profileUrl);
    const [message, setMessage] = useState("");
    const history = useHistory();

    const logout = async e => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, { withCredentials: true }).then(response => {
                setMessage(response.data.message);
                history.push("/");
            });
        } catch (err) {
            setMessage(err.response.data.error);
        }
    };

    const search = () => {
        if (!steamID) return setMessage("No steam account found!");
        space.emit("searching", { name, steamID, thumbnail, profile });
        setMessage("searching");
        document.getElementById("play").hidden = true;
        document.getElementById("cancel").hidden = false;
    };

    const cancel = () => {
        space.emit("cancel", steamID);
        setMessage("");
        document.getElementById("play").hidden = false;
        document.getElementById("cancel").hidden = true;
    };

    // const accept = () => {
    //     space.emit("accepted", steamID);
    //     setMessage("accepted");
    //     document.getElementById("accept").hidden = true;
    // };

    space.on("matchFound", room => {
        window.alert("Match found!");
        history.push("/room/" + room);
    });

    // space.on("matchNotAccepted", () => {
    //     setMessage("Match was found but some player(s) failed to accept...");
    //     document.getElementById("accept").hidden = true;
    //     document.getElementById("play").hidden = false;
    // });

    return (
        <div>
            <h1>Welcome {name}</h1>
            <br />
            <img src={thumbnail} alt="" />
            <br />
            <br />
            <span>Email: {email}</span>
            <br />
            <span>Verified: {verified.toString()}</span>
            <br />
            <span>SteamID: {steamID}</span>
            <br />
            <p>
                Profile:&nbsp;
                <a href={profile} target="_blank" rel="noreferrer">
                    {profile}
                </a>
            </p>
            <br />
            <br />
            <button id="play" onClick={() => search()} hidden={steamID == null}>
                Play
            </button>
            <br /> <br />
            <button id="cancel" onClick={() => cancel()} hidden={steamID == null || true}>
                Cancel
            </button>
            <br /> <br />
            <span>{message}</span>
            <br /> <br />
            <button onClick={() => logout()}>Logout</button>
            <br />
            <br />
            <a href={`${process.env.REACT_APP_API_URL}/auth/steam`} hidden={steamID !== null}>
                Connect Steam
            </a>
        </div>
    );
}

export default Dashboard;
