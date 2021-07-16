import { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const history = useHistory();

    const login = async e => {
        e.preventDefault();
        try {
            await axios
                .post(
                    `${process.env.REACT_APP_API_URL}/auth/login`,
                    {
                        email,
                        password
                    },
                    { withCredentials: true }
                )
                .then(response => {
                    setMessage(response.data.message);
                    history.push("/dashboard");
                });
        } catch (err) {
            setMessage(err.response.data.error);
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <br />
            <form method="POST" onSubmit={e => login(e)}>
                <input type="email" name="email" onChange={e => setEmail(e.target.value)} required />
                <br />
                <input type="password" name="password" onChange={e => setPassword(e.target.value)} required />
                <br />
                <br />
                <button type="submit">Log In</button>
            </form>
            <br />
            <span>{message}</span>
        </div>
    );
}

export default Login;
