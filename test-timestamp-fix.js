// Test script to verify timestamp field handling
const testTimestampHandling = () => {
    console.log('Testing timestamp field handling...');
    
    // Test data with empty strings
    const testData = {
        title: "Test Ticket",
        description: "Test description",
        ticket_type: "task",
        priority: "medium",
        platform: "web",
        status: "open",
        organization_id: "test-org",
        expected_completion_date: "",
        closed_at: "",
        jira_link: "",
        only_show_in_admin: false,
        created_at: "",
        updated_at: ""
    };
    
    console.log('Original test data:', testData);
    
    // Simulate the cleanTimestampFields function
    const cleanTimestampFields = (data) => {
        const cleaned = { ...data };
        
        // Convert empty strings to null for timestamp fields that can be updated
        const timestampFields = ['expected_completion_date', 'closed_at'];
        
        timestampFields.forEach(field => {
            if (cleaned[field] === "" || cleaned[field] === undefined) {
                cleaned[field] = null;
            }
        });
        
        // Remove created_at and updated_at from update data as they should be managed by database
        delete cleaned.created_at;
        delete cleaned.updated_at;
        
        return cleaned;
    };
    
    const cleanedData = cleanTimestampFields(testData);
    console.log('Cleaned data:', cleanedData);
    
    // Verify the results
    console.log('\nVerification:');
    console.log('expected_completion_date should be null:', cleanedData.expected_completion_date === null);
    console.log('closed_at should be null:', cleanedData.closed_at === null);
    console.log('created_at should be undefined:', cleanedData.created_at === undefined);
    console.log('updated_at should be undefined:', cleanedData.updated_at === undefined);
    
    // Test with actual values
    const testDataWithValues = {
        ...testData,
        expected_completion_date: "2024-12-31",
        closed_at: "2024-12-31T23:59:59"
    };
    
    console.log('\nTest with actual values:');
    console.log('Original data with values:', testDataWithValues);
    
    const cleanedDataWithValues = cleanTimestampFields(testDataWithValues);
    console.log('Cleaned data with values:', cleanedDataWithValues);
    
    console.log('\nVerification with values:');
    console.log('expected_completion_date should be "2024-12-31":', cleanedDataWithValues.expected_completion_date === "2024-12-31");
    console.log('closed_at should be "2024-12-31T23:59:59":', cleanedDataWithValues.closed_at === "2024-12-31T23:59:59");
};

testTimestampHandling(); 