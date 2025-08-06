const fetch = require("node-fetch");

async function testTicketsAPI() {
    console.log("Testing tickets API...");

    try {
        // Test without authentication
        const response = await fetch(
            "https://hotro.lotuslms.com/api/tickets?page=1&limit=20"
        );
        const data = await response.json();
        console.log("Response without auth:", data);

        // Test with different user roles (you'll need to provide actual cookies)
        console.log("\nTo test with different user roles, you need to:");
        console.log("1. Login as admin user and get cookies");
        console.log("2. Login as regular user and get cookies");
        console.log("3. Compare the responses");
    } catch (error) {
        console.error("Error testing API:", error);
    }
}

testTicketsAPI();
