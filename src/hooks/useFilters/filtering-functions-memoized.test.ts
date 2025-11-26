import { describe, expect, test } from "vitest";
import { escapeDelimiter } from "./filtering-functions-memoized";

describe("escapeDelimiter", () => {
	describe("basic functionality", () => {
		test("escapes pipe delimiter in simple string", () => {
			const result = escapeDelimiter("hello|world", "|");
			expect(result).toBe("hello\\|world");
		});

		test("escapes comma delimiter in simple string", () => {
			const result = escapeDelimiter("hello,world", ",");
			expect(result).toBe("hello\\,world");
		});

		test("returns unchanged string when delimiter not present", () => {
			const result = escapeDelimiter("hello world", "|");
			expect(result).toBe("hello world");
		});

		test("handles empty string", () => {
			const result = escapeDelimiter("", "|");
			expect(result).toBe("");
		});
	});

	describe("multiple delimiters", () => {
		test("escapes multiple pipe delimiters", () => {
			const result = escapeDelimiter("a|b|c|d", "|");
			expect(result).toBe("a\\|b\\|c\\|d");
		});

		test("escapes multiple comma delimiters", () => {
			const result = escapeDelimiter("apple,banana,cherry,date", ",");
			expect(result).toBe("apple\\,banana\\,cherry\\,date");
		});

		test("escapes consecutive delimiters", () => {
			const result = escapeDelimiter("a||b", "|");
			expect(result).toBe("a\\|\\|b");
		});
	});

	describe("backslash handling", () => {
		test("escapes existing backslashes", () => {
			const result = escapeDelimiter("hello\\world", "|");
			expect(result).toBe("hello\\\\world");
		});

		test("escapes backslashes before escaping delimiters", () => {
			const result = escapeDelimiter("hello\\|world", "|");
			// First backslash becomes \\, then | becomes \|
			expect(result).toBe("hello\\\\\\|world");
		});

		test("handles multiple backslashes", () => {
			const result = escapeDelimiter("a\\\\b", "|");
			expect(result).toBe("a\\\\\\\\b");
		});

		test("handles backslash at end", () => {
			const result = escapeDelimiter("hello\\", "|");
			expect(result).toBe("hello\\\\");
		});

		test("handles backslash at start", () => {
			const result = escapeDelimiter("\\hello", "|");
			expect(result).toBe("\\\\hello");
		});
	});

	describe("special regex characters as delimiters", () => {
		test("escapes dot delimiter", () => {
			const result = escapeDelimiter("hello.world", ".");
			expect(result).toBe("hello\\.world");
		});

		test("escapes asterisk delimiter", () => {
			const result = escapeDelimiter("hello*world", "*");
			expect(result).toBe("hello\\*world");
		});

		test("escapes plus delimiter", () => {
			const result = escapeDelimiter("hello+world", "+");
			expect(result).toBe("hello\\+world");
		});

		test("escapes question mark delimiter", () => {
			const result = escapeDelimiter("hello?world", "?");
			expect(result).toBe("hello\\?world");
		});

		test("escapes caret delimiter", () => {
			const result = escapeDelimiter("hello^world", "^");
			expect(result).toBe("hello\\^world");
		});

		test("escapes dollar sign delimiter", () => {
			const result = escapeDelimiter("hello$world", "$");
			expect(result).toBe("hello\\$world");
		});

		test("escapes opening bracket delimiter", () => {
			const result = escapeDelimiter("hello[world", "[");
			expect(result).toBe("hello\\[world");
		});

		test("escapes closing bracket delimiter", () => {
			const result = escapeDelimiter("hello]world", "]");
			expect(result).toBe("hello\\]world");
		});

		test("escapes opening parenthesis delimiter", () => {
			const result = escapeDelimiter("hello(world", "(");
			expect(result).toBe("hello\\(world");
		});

		test("escapes closing parenthesis delimiter", () => {
			const result = escapeDelimiter("hello)world", ")");
			expect(result).toBe("hello\\)world");
		});

		test("escapes opening brace delimiter", () => {
			const result = escapeDelimiter("hello{world", "{");
			expect(result).toBe("hello\\{world");
		});

		test("escapes closing brace delimiter", () => {
			const result = escapeDelimiter("hello}world", "}");
			expect(result).toBe("hello\\}world");
		});
	});

	describe("edge cases", () => {
		test("handles string that is just the delimiter", () => {
			const result = escapeDelimiter("|", "|");
			expect(result).toBe("\\|");
		});

		test("handles string with only delimiters", () => {
			const result = escapeDelimiter("|||", "|");
			expect(result).toBe("\\|\\|\\|");
		});

		test("handles delimiter at start", () => {
			const result = escapeDelimiter("|hello", "|");
			expect(result).toBe("\\|hello");
		});

		test("handles delimiter at end", () => {
			const result = escapeDelimiter("hello|", "|");
			expect(result).toBe("hello\\|");
		});

		test("handles unicode characters", () => {
			const result = escapeDelimiter("hello|世界", "|");
			expect(result).toBe("hello\\|世界");
		});

		test("handles emojis", () => {
			const result = escapeDelimiter("hello|😀|world", "|");
			expect(result).toBe("hello\\|😀\\|world");
		});

		test("handles newlines", () => {
			const result = escapeDelimiter("hello|world\nnext line", "|");
			expect(result).toBe("hello\\|world\nnext line");
		});

		test("handles tabs", () => {
			const result = escapeDelimiter("hello|\tworld", "|");
			expect(result).toBe("hello\\|\tworld");
		});
	});

	describe("complex real-world scenarios", () => {
		test("handles CSV-like data with comma delimiter", () => {
			const result = escapeDelimiter("John Doe,123 Main St, Apt 4,New York", ",");
			expect(result).toBe("John Doe\\,123 Main St\\, Apt 4\\,New York");
		});

		test("handles path-like data with pipe delimiter", () => {
			const result = escapeDelimiter("src|components|Button.tsx", "|");
			expect(result).toBe("src\\|components\\|Button.tsx");
		});

		test("handles mixed special characters and delimiters", () => {
			const result = escapeDelimiter("$100.50|€200.75", "|");
			expect(result).toBe("$100.50\\|€200.75");
		});

		test("handles already escaped delimiters (double escaping)", () => {
			const result = escapeDelimiter("hello\\|world", "|");
			// First pass: \ becomes \\
			// Second pass: | becomes \|
			// Result: \\ followed by \|
			expect(result).toBe("hello\\\\\\|world");
		});
	});

	describe("regression test for pipe delimiter bug", () => {
		test("correctly escapes pipe characters (not treated as alternation)", () => {
			// This test would fail with the old buggy code that had:
			// new RegExp(`\\${delimiter...}`, "g")
			// 
			// The bug: With pipe delimiter, the old code created pattern `\\|`
			// which in regex means "(backslash) OR (empty)" due to alternation,
			// causing it to match every position in the string instead of
			// actual pipe characters.
			
			const input = "a|b|c";
			const result = escapeDelimiter(input, "|");
			
			// Should escape only the actual pipe characters
			expect(result).toBe("a\\|b\\|c");
			
			// Verify the result has exactly 2 escaped pipes (not more)
			const escapedPipes = (result.match(/\\[|]/g) || []).length;
			expect(escapedPipes).toBe(2);
			
			// Verify the string length is correct (original 5 + 2 backslashes = 7)
			expect(result.length).toBe(7);
		});

		test("pipe delimiter doesn't add escapes at every position", () => {
			// Another way to catch the bug: the old code would insert
			// escaped pipes at every string position
			const input = "abc";
			const result = escapeDelimiter(input, "|");
			
			// Should return unchanged since there are no pipes
			expect(result).toBe("abc");
			
			// Should NOT have any escaped pipes
			expect(result).not.toContain("\\|");
		});

		test("only actual pipe characters are escaped", () => {
			const input = "before|after";
			const result = escapeDelimiter(input, "|");
			
			// Count backslashes - should have exactly 1 (for the one pipe)
			const backslashCount = (result.match(/\\/g) || []).length;
			expect(backslashCount).toBe(1);
			
			// Verify structure
			expect(result).toBe("before\\|after");
		});
	});

	describe("idempotency and consistency", () => {
		test("escaping twice with same delimiter adds more escapes", () => {
			const first = escapeDelimiter("a|b", "|");
			expect(first).toBe("a\\|b");
			
			const second = escapeDelimiter(first, "|");
			// Backslash gets escaped, then pipe gets escaped
			expect(second).toBe("a\\\\\\|b");
		});

		test("different delimiters don't interfere", () => {
			const withPipe = escapeDelimiter("a|b,c", "|");
			expect(withPipe).toBe("a\\|b,c");
			
			const withComma = escapeDelimiter("a|b,c", ",");
			expect(withComma).toBe("a|b\\,c");
		});

		test("escaping preserves string content except for added backslashes", () => {
			const input = "hello|world";
			const result = escapeDelimiter(input, "|");
			
			// Remove the backslashes to get back something close to original
			const unescaped = result.replace(/\\/g, "");
			expect(unescaped).toBe(input);
		});
	});
});
