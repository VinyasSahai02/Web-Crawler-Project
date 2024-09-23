import { PlaywrightCrawler, Dataset } from "crawlee";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, enqueueLinks, request }) => {
    if (request.label === "DETAIL") {
      const title = await page.locator(".product-meta h1").textContent();

      const priceElement = await page
        .locator("span.price")
        .filter({
          hasText: "$",
        })
        .first();
      const currentPrice = await priceElement.textContent();
      const rawPrice = currentPrice?.split("$")[1];
      const price = Number(rawPrice?.replace(",", ""));

      const inStockElement = page
        .locator("span.product-form__inventory")
        .filter({
          hasText: "In stock",
        })
        .first();
        const inStock = (await inStockElement.count()) > 0;
        
        await Dataset.pushData({ title, price, inStock })
        await Dataset.exportToJSON('crawledProducts-jsonFormat')
        await Dataset.exportToCSV('crawledProducts-csvFormat')
    } else if (request.label === "COLLECTION") {
      const productSelector = ".product-item > a";
      const nextPageSelector = "a.pagination__next";

      await page.waitForSelector(productSelector);
      await enqueueLinks({
        selector: productSelector,
        label: "DETAIL",
      });

      //$ in playwright is same as querySelector
      //$$ in playwright is same as querySelectorAll
      const nextButton = await page.$(nextPageSelector);
      if (nextButton) {
        await enqueueLinks({
          selector: nextPageSelector,
          label: "COLLECTION",
        });
      }
    } else {
      const collectionSelector = ".collection-block-item";
      await page.waitForSelector(collectionSelector);
      await enqueueLinks({
        selector: collectionSelector,
        label: "COLLECTION",
      });
    }
  },
});

await crawler.run(["https://warehouse-theme-metal.myshopify.com/collections"]);
