const request = require("supertest");
const app = require("./server");

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => {
    return {
      data: {},
      sets: { "flashsale:buyers": new Set() },
      get: jest.fn(function (key) {
        return this.data[key] || null;
      }),
      set: jest.fn(function (key, val) {
        this.data[key] = val;
        return "OK";
      }),
      del: jest.fn(function (key) {
        delete this.data[key];
        if (this.sets[key]) this.sets[key].clear();
        return 1;
      }),
      sismember: jest.fn(function (key, member) {
        return this.sets[key] && this.sets[key].has(member) ? 1 : 0;
      }),
      sadd: jest.fn(function (key, member) {
        if (!this.sets[key]) this.sets[key] = new Set();
        this.sets[key].add(member);
        return 1;
      }),
      decr: jest.fn(function (key) {
        this.data[key] = (parseInt(this.data[key]) || 0) - 1;
        return this.data[key];
      }),
      eval: jest.fn(function (_script, _keys, stockKey, buyersKey, user) {
        // mimic your Lua logic
        if (this.sets[buyersKey] && this.sets[buyersKey].has(user)) return 1;
        const stock = parseInt(this.data[stockKey] || "0");
        if (stock <= 0) return 2;
        this.data[stockKey] = stock - 1;
        if (!this.sets[buyersKey]) this.sets[buyersKey] = new Set();
        this.sets[buyersKey].add(user);
        return 0;
      }),
    };
  });
});

const FlashsaleSetup = require("./models/FlashsaleSetup");

describe("Flash Sale API", () => {
  let saleSetup;

  beforeEach(() => {
    saleSetup = {
      _id: "123",
      opening: new Date(Date.now() - 1000).toISOString(),
      preOpen: 0,
      stoppedAt: 100000,
      stock: 5,
      buyers: [],
    };

    FlashsaleSetup.findOne.mockResolvedValue(saleSetup);
    FlashsaleSetup.updateOne.mockResolvedValue({ acknowledged: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Check flash sale setup", async () => {
    const res = await request(app).get("/flashsale-setup");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
    expect(res.body.stock).toBe(5);
  });

  test("/purchase: Generate first purchase", async () => {
    const res = await request(app)
      .post("/purchase")
      .send({ user: "alice" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Successful");
  });

  test("/purchase: reject duplicate purchase", async () => {
    // First purchase
    await request(app).post("/purchase").send({ user: "bob" });

    // Second purchase same user
    const res = await request(app).post("/purchase").send({ user: "bob" });
    expect(res.status).toBe(403);
    expect(res.body.status).toBe("exists");
  });

  test("/purchase: reject if sold out", async () => {
    // Set stock to 0
    saleSetup.stock = 0;
    FlashsaleSetup.findOne.mockResolvedValue(saleSetup);

    const res = await request(app).post("/purchase").send({ user: "charlie" });
    expect(res.status).toBe(409);
    expect(res.body.status).toBe("soldout");
  });

  test("Check purchase status by username", async () => {
    await request(app).post("/purchase").send({ user: "dave" });

    const res = await request(app).get("/check/dave");
    expect(res.status).toBe(200);
    expect(res.body.purchased).toBe(true);
  });
});
