const { exec } = require("child_process");

function testRoleAPI() {
    console.log("🧪 Testing role API...\n");

    // Test role API
    console.log("Testing /api/test-role:");
    exec(
        'curl -s "https://hotro.lotuslms.com/api/test-role" | jq "."',
        (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error:", error.message);
                return;
            }
            console.log("Response:", stdout);
        }
    );
}

testRoleAPI();
