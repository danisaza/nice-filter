import "@testing-library/jest-dom";

// Mock scrollIntoView since jsdom doesn't implement it
Element.prototype.scrollIntoView = () => {};

// Mock ResizeObserver since jsdom doesn't implement it
// Required for Radix UI dropdown menus
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;
