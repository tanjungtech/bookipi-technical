const request = require('supertest');
const mongoose = require('mongoose');

// Mock Mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(() => Promise.resolve()),
  connection: {
    close: jest.fn(),
  },
}));

// Mock FlashsaleSetup model
const mockFlashsaleSetup = {
  _id: '60c72b2f9b1d8f001c8a4d7d',
  name: 'Summer Sale',
  isActive: true,
};

jest.mock('./models/FlashsaleSetup', () => ({
  findOne: jest.fn(() => Promise.resolve(mockFlashsaleSetup)),
}));

const FlashsaleSetup = require('./models/FlashsaleSetup'); // keep reference
const app = require('./app.js');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FlashsaleSetup.findOne.mockResolvedValue(mockFlashsaleSetup);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  it('GET / should return "Server is running!"', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Server is running!');
  });

  it('GET /flashsale-setup should return flashsale data', async () => {
    const response = await request(app).get('/flashsale-setup');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockFlashsaleSetup);
  });

  it('GET /flashsale-setup should return a 500 error on database failure', async () => {
    FlashsaleSetup.findOne.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app).get('/flashsale-setup');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Database connection failed' }); // adjust to your app’s error response
  });
});
