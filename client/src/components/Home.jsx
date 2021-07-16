import { Link } from "react-router-dom";

function Home() {
    return (
        <div>
            <h1>Hexagon</h1>
            <br />
            <span>Power your gaming!</span>
            <br />
            <Link to="/auth/login">Log In</Link>
            &nbsp;
            <Link to="/auth/signup">Sign Up</Link>
            <br />
            <Link to="/dashboard">Dashboard</Link>
        </div>
    );
}

export default Home;
