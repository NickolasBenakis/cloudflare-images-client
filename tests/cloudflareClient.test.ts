// sum.test.js
import { expect, test, vi } from "vitest";
import { cloudflareClient } from "../src/index";

test("adds 1 + 2 to equal 3", async () => {
	const response = await cloudflareClient.uploadImageFromUrl({
		imageUrl:
			"https://images.squarespace-cdn.com/content/v1/60f1a490a90ed8713c41c36c/1629223610791-LCBJG5451DRKX4WOB4SP/37-design-powers-url-structure.jpeg",
		metadata: {},
	});

	expect(response).toEqual({
		errors: [],
		messages: [],
		result: {
			filename: "string",
			id: "string",
			meta: {},
			requireSignedURLs: false,
			uploaded: "string",
			variants: [],
		},
		success: true,
	});
	/*
   const response = await cloudflareClient.uploadImageFromUrl({});

    expect(response).toEqual({
        errors: [],
        messages: [],
        result: {
            filename: "string",
            id: "string",
            meta: {},
            requireSignedURLs: false,
            uploaded: "string",
            variants: [],
        },
        success: true,
    });
*/
});
