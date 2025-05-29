# Getting Supabase Service Role Key

## Instructions:

1. **Go to Supabase Dashboard**: Open https://supabase.com/dashboard/project/khzbklcvmlkhrraibksx

2. **Navigate to API Settings**: 
   - Click on "Settings" in the left sidebar
   - Click on "API" under the Settings section

3. **Copy the Service Role Key**:
   - Look for the "Project API keys" section
   - Find the "service_role" key (it's the secret one, not the anon key)
   - Click the "Copy" button next to it

4. **Update the .env file**:
   - Replace `your-service-role-key-here` in your .env file with the actual service role key

5. **Important Security Note**:
   - The service role key has admin privileges
   - Never expose it in client-side code
   - Only use it in secure server environments like Edge Functions

## Example .env entry:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDQ4NzU2NDksImV4cCI6MTk2MDQ1MTY0OX0...
```

## After updating:
- The Edge Function will be able to authenticate users and access the database
- You can test the function using the MindOp Service Test Page at http://localhost:3004/mindop-test
