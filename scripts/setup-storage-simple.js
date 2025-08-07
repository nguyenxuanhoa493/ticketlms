const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing required environment variables");
    console.log(
        "Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    console.log("\nPlease create a .env file with these variables:");
    console.log("NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key");
    console.log(
        "\nYou can find these in your Supabase dashboard under Settings > API"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
    try {
        console.log("Checking Supabase storage configuration...");
        console.log("URL:", supabaseUrl);

        // Test connection
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("❌ Error connecting to Supabase:", error.message);
            console.log("\nPossible solutions:");
            console.log("1. Check your environment variables");
            console.log("2. Make sure your Supabase project is active");
            console.log("3. Check your internet connection");
            return;
        }

        console.log("✅ Successfully connected to Supabase");
        console.log(
            "Available buckets:",
            data.map((b) => b.name)
        );

        const bucketExists = data.some(
            (bucket) => bucket.name === "ticket-attachments"
        );

        if (bucketExists) {
            console.log("✅ Bucket ticket-attachments exists");

            // Test upload permissions
            const testFile = new Blob(["test"], { type: "text/plain" });
            const testFileName = "test/.keep";

            const { error: uploadError } = await supabase.storage
                .from("ticket-attachments")
                .upload(testFileName, testFile, { upsert: true });

            if (uploadError) {
                console.error("❌ Upload test failed:", uploadError.message);
                console.log(
                    "\nThis means the bucket exists but RLS policies need to be configured."
                );
                console.log(
                    "Please run the following SQL in your Supabase SQL editor:"
                );
                console.log(`
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-attachments');
                `);
            } else {
                console.log(
                    "✅ Upload test successful - bucket is properly configured"
                );

                // Clean up test file
                await supabase.storage
                    .from("ticket-attachments")
                    .remove([testFileName]);
            }
        } else {
            console.log("❌ Bucket ticket-attachments does not exist");
            console.log(
                "\nYou need to create the bucket manually in Supabase dashboard:"
            );
            console.log("1. Go to Storage in your Supabase dashboard");
            console.log('2. Click "Create a new bucket"');
            console.log("3. Name it: ticket-attachments");
            console.log("4. Make it public");
            console.log("5. Set file size limit to 5MB");
            console.log(
                "6. Add allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp"
            );
        }
    } catch (error) {
        console.error("Setup failed:", error);
    }
}

checkStorage();
