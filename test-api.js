const { exec } = require("child_process");

async function testAPI() {
    console.log("🧪 Testing API endpoints...\n");

    // Test 1: API không có authentication
    console.log("1. Testing API without authentication:");
    exec(
        'curl -s "https://hotro.lotuslms.com/api/tickets?page=1&limit=5" | jq "."',
        (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error:", error.message);
                return;
            }
            console.log("Response:", stdout);
        }
    );

    // Test 2: Kiểm tra xem có ticket nào có only_show_in_admin = true không
    console.log("\n2. Checking for admin-only tickets in response:");
    exec(
        "curl -s \"https://hotro.lotuslms.com/api/tickets?page=1&limit=20\" | jq '.tickets[] | select(.only_show_in_admin == true) | {id, title, only_show_in_admin}'",
        (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error:", error.message);
                return;
            }
            if (stdout.trim()) {
                console.log("⚠️  Found admin-only tickets:", stdout);
            } else {
                console.log("✅ No admin-only tickets found in response");
            }
        }
    );

    // Test 3: Kiểm tra tổng số tickets
    console.log("\n3. Total tickets count:");
    exec(
        "curl -s \"https://hotro.lotuslms.com/api/tickets?page=1&limit=20\" | jq '.tickets | length'",
        (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error:", error.message);
                return;
            }
            console.log("Total tickets:", stdout.trim());
        }
    );
}

testAPI();
