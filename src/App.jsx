import WordCounter from "./components/WordCounter.jsx";
import HighlightToggle from "./components/HighlightToggle.jsx";
import ServerStatus from "./components/ServerStatus.jsx";
import LoginForm from "./components/LoginForm.jsx";

function App() {
    return (
        <div>
            <h1>Lectio</h1>
            <WordCounter />
            <HighlightToggle />
            <ServerStatus />
            <LoginForm />
        </div>
    );
}

export default App;
