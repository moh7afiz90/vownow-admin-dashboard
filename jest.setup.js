import '@testing-library/jest-dom'

// Add polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint32Array(1)),
    randomUUID: jest.fn().mockReturnValue('12345678-1234-1234-1234-123456789012'),
  },
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Web APIs for Next.js API route testing
global.fetch = jest.fn()
global.Headers = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  append: jest.fn(),
  forEach: jest.fn(),
}))

// Mock Request and Response for API testing
global.Request = jest.fn()
global.Response = class {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }
}