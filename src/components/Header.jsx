function Header({ loggedInEmail, onLoginClick, onLogout }) {
    return (
        <header className="header">
            <h1>Lectio</h1>
            {loggedInEmail ? (
                <div>
                    <span className="header-email">{loggedInEmail}</span>
                    <button onClick={onLogout}>Log out</button>
                </div>
            ) : (
                <button onClick={onLoginClick}>Log in</button>
            )}
        </header>
    );
}

export default Header;