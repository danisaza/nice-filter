import "@testing-library/jest-dom";

// Mock scrollIntoView since jsdom doesn't implement it
Element.prototype.scrollIntoView = () => {};

