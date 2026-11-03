import "dotenv/config";
import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
const PORT = 3000;

const db = new pg.Client({
    host: "localhost",
    port: 5432,
    database: "lectio",
    user: "davidmarian",
});
db.connect();

app.get("/", (req, res) => {
    res.json({ message: "Lectio server is running" });
});

app.get("/users/count", async (req, res) => {
    const result = await db.query("SELECT COUNT(*) FROM users");
    res.json({ count: result.rows[0].count });
});

app.post("/register", async (req, res) => {
    const { email, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hashedPassword]);
    }catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email already exists" });
        }
        throw error;
    }
    res.status(201).json({ message: "User created" });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
        return res.status(401).json({ error: "Wrong email or password" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        return res.status(401).json({ error: "Wrong email or password" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({token: token});
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
