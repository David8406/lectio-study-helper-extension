import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./app.js";

describe("GET /", () => {
    test("says the server is running", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Lectio server is running");
    });
});

describe("POST /summary needs a login", () => {
    test("without a token → 401", async () => {
        const response = await request(app).post("/summary").send({ text: "Some page text" });
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Please log in");
    });

    test("with a made-up token → 401", async () => {
        const response = await request(app)
            .post("/summary")
            .set("Authorization", "Bearer not-a-real-token")
            .send({ text: "Some page text" });
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Please log in again");
    });

    test("with a token signed by someone else (wrong secret) → 401", async () => {
        const fakeToken = jwt.sign({ userId: 1 }, "not-the-real-secret");
        const response = await request(app)
            .post("/summary")
            .set("Authorization", `Bearer ${fakeToken}`)
            .send({ text: "Some page text" });
        expect(response.status).toBe(401);
    });
});

describe("passwords must match", () => {
    test("POST /register with different passwords → 400", async () => {
        const response = await request(app)
            .post("/register")
            .send({ email: "test@example.com", password: "secret123", passwordConfirm: "secret124" });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Passwords do not match");
    });

    test("POST /reset-password with different passwords → 400", async () => {
        const response = await request(app)
            .post("/reset-password")
            .type("form")
            .send({ code: "any-code", password: "secret123", passwordConfirm: "secret124" });
        expect(response.status).toBe(400);
    });
});
