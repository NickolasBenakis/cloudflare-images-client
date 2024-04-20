import "dotenv/config";

export { default as cloudflareClient } from "./lib/cloudflareClient";

// const main = async () => {
// 	const response = await cloudflareClient.uploadImageFromUrl({
// 		imageUrl:
// 			"https://images.squarespace-cdn.com/content/v1/60f1a490a90ed8713c41c36c/1629223610791-LCBJG5451DRKX4WOB4SP/37-design-powers-url-structure.jpeg",
// 		metadata: {},
// 	});
// 	console.log(response);
// };
// await main();
