const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    try {
        console.log('Setting up Supabase storage...');

        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('Error listing buckets:', listError);
            return;
        }

        const bucketExists = buckets.some(bucket => bucket.name === 'ticket-attachments');
        
        if (!bucketExists) {
            console.log('Creating ticket-attachments bucket...');
            
            const { data, error } = await supabase.storage.createBucket('ticket-attachments', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 5242880, // 5MB
            });

            if (error) {
                console.error('Error creating bucket:', error);
                return;
            }

            console.log('✅ Bucket created successfully:', data);
        } else {
            console.log('✅ Bucket ticket-attachments already exists');
        }

        // Create folders if they don't exist
        const folders = ['avatars', 'images'];
        
        for (const folder of folders) {
            console.log(`Creating folder: ${folder}`);
            
            // Create a dummy file to create the folder
            const dummyFile = new Blob([''], { type: 'text/plain' });
            const dummyFileName = `${folder}/.keep`;
            
            const { error: uploadError } = await supabase.storage
                .from('ticket-attachments')
                .upload(dummyFileName, dummyFile, {
                    upsert: true
                });

            if (uploadError && uploadError.message !== 'The resource already exists') {
                console.error(`Error creating folder ${folder}:`, uploadError);
            } else {
                console.log(`✅ Folder ${folder} ready`);
            }
        }

        console.log('🎉 Storage setup completed successfully!');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupStorage();
