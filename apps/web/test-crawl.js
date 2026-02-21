/**
 * Test script for Crawl4AI via Next.js Proxy
 * Usage: node test-crawl.js <optional_token>
 */

const URL_TO_CRAWL = "https://www.goeic.gov.eg/ar";
const PROXY_URL = "http://localhost:3000/api/crawl/proxy/crawl/job";

async function testCrawl() {
    const token = process.argv[2];

    const payload = {
        urls: [URL_TO_CRAWL],
        browser_config: {
            headless: true,
            user_agent: "Crawl4AI Bot"
        },
        crawler_config: {
            word_count_threshold: 10,
            extraction_strategy: "markdown",
            bypass_cache: true
        }
    };

    console.log(`Starting crawl test for: ${URL_TO_CRAWL}`);
    console.log(`Targeting proxy: ${PROXY_URL}`);

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("Using provided Authorization token.");
    } else {
        console.warn("Warning: No token provided. If the backend requires authentication, this may fail.");
    }

    try {
        const response = await fetch(PROXY_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));

        if (response.ok && data.task_id) {
            console.log("\nSuccess! Task ID received:", data.task_id);
            console.log(`You can monitor this task at: http://localhost:3000/api/crawl/proxy/crawl/job/${data.task_id}`);
        }
    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testCrawl();
