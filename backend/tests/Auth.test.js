const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const authRouter = require("../routes/Auth"); // your existing auth.js router

const app = express();
app.use(express.json());
app.use("/auth", authRouter); // mount the router on /auth

beforeAll(async () => {
  // connect to a test database
  await mongoose.connect(process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/testdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("Auth API Integration Tests", () => {
  test("should signup a new user", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("email", "test@example.com");
  });

  test("should not allow duplicate signup", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Another User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
  });

  test("should login with valid credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("email", "test@example.com");
  });

  test("should reject login with wrong password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "wrongpass",
    });

    expect(res.statusCode).toBe(404);
  });

  test("should logout user", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.statusCode).toBe(200);
  });

  test("should return 401 on check-auth without login", async () => {
    const res = await request(app).get("/auth/check-auth");
    expect(res.statusCode).toBe(401);
  });
});
