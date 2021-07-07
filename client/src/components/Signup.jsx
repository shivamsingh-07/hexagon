import { useState } from "react";
import axios from "axios";

function Signup() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const signup = async e => {
        e.preventDefault();
        try {
            await axios
                .post(
                    "http://localhost:5000/auth/signup",
                    {
                        username,
                        email,
                        password
                    },
                    { withCredentials: true }
                )
                .then(response => {
                    setMessage(response.data.message);
                });
        } catch (err) {
            setMessage(err.response.data.error);
        }
    };

    return (
        <div>
            <h1>Signup</h1>
            <br />
            <form method="POST" onSubmit={e => signup(e)}>
                <input type="text" name="username" onChange={e => setUsername(e.target.value)} />
                <br />
                <input type="email" name="email" onChange={e => setEmail(e.target.value)} />
                <br />
                <input type="password" name="password" onChange={e => setPassword(e.target.value)} />
                <br />
                <br />
                <button type="submit">Sign Up</button>
            </form>
            <br />
            <span>{message}</span>
        </div>
    );
}

export default Signup;
